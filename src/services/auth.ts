import { supabase } from './supabase';
import type {
  ClientRegistrationData,
  WorkerRegistrationData,
  UserRole,
} from '../types';
import type { User } from '@supabase/supabase-js';
import { barangays } from '../data/barangays';

/**
 * Register a new client account with Supabase Auth.
 * Sets user metadata role to 'client'.
 */
export async function registerClient(
  data: ClientRegistrationData
): Promise<{ error?: string }> {
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: { role: 'client' },
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes('already registered')) {
      return { error: 'This email is already registered' };
    }
    return { error: error.message };
  }

  // Insert into public.users table
  if (authData.user?.id) {
    await supabase.from('users').insert({
      id: authData.user.id,
      email: data.email,
      role: 'client',
      failed_login_attempts: 0,
    });
  }

  return {};
}

/**
 * Register a new worker account with Supabase Auth and create worker profile.
 * Sets user metadata role to 'worker', then inserts into workers table.
 * Resilient: image upload failure won't block registration.
 */
export async function registerWorker(
  data: WorkerRegistrationData
): Promise<{ error?: string }> {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: { role: 'worker' },
    },
  });

  if (authError) {
    if (authError.message.toLowerCase().includes('already registered')) {
      return { error: 'This email is already registered' };
    }
    if (authError.message.toLowerCase().includes('rate limit')) {
      return { error: 'Too many attempts. Please wait a few minutes and try again.' };
    }
    return { error: authError.message };
  }

  const userId = authData.user?.id;
  if (!userId) {
    return { error: 'Registration failed. Please try again.' };
  }

  // Upload profile image to Supabase Storage (optional - continue if fails)
  let profileImageUrl = '';
  if (data.profileImage) {
    try {
      const fileExt = data.profileImage.name.split('.').pop();
      const filePath = `${userId}/profile.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, data.profileImage, {
          upsert: true,
        });

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('profiles')
          .getPublicUrl(filePath);
        profileImageUrl = urlData.publicUrl;
      } else {
        console.warn('Image upload failed, continuing without image:', uploadError.message);
      }
    } catch (e) {
      console.warn('Image upload exception, continuing without image:', e);
    }
  }

  // Get coordinates: prefer user-provided lat/lng, fallback to barangay centroid
  const barangayInfo = barangays.find(b => b.name === data.barangay);
  const coordinates = data.latitude && data.longitude
    ? `SRID=4326;POINT(${data.longitude} ${data.latitude})`
    : barangayInfo
      ? `SRID=4326;POINT(${barangayInfo.lng} ${barangayInfo.lat})`
      : null;

  // First, insert into public.users table (workers table has FK to users)
  const { error: userInsertError } = await supabase.from('users').insert({
    id: userId,
    email: data.email,
    role: 'worker',
    failed_login_attempts: 0,
  });

  if (userInsertError) {
    console.error('Users table insert error:', userInsertError);
    // Continue anyway — might already exist from a previous partial registration
  }

  // Insert worker profile into workers table
  const { error: insertError } = await supabase.from('workers').insert({
    user_id: userId,
    name: data.name,
    skills: data.skills,
    barangay: data.barangay,
    coordinates: coordinates,
    contact_number: data.contactNumber,
    profile_image_url: profileImageUrl,
    verification_status: 'pending',
    ...(data.address ? { address: data.address } : {}),
  });

  if (insertError) {
    console.error('Worker insert error:', insertError);
    return { error: 'Account created but profile setup failed. Please log in and try again.' };
  }

  return {};
}

/**
 * Log in a user with email and password.
 * Implements failed attempt tracking and account lockout (5 failures → 15 min lock).
 * Returns a generic error message without revealing which field is incorrect.
 * Handles the case where the user doesn't exist in the public.users table.
 */
export async function login(
  email: string,
  password: string
): Promise<{ error?: string; role?: UserRole }> {
  // Check if account is currently locked (ignore if user doesn't exist in public table)
  const { data: userData } = await supabase
    .from('users')
    .select('failed_login_attempts, locked_until')
    .eq('email', email)
    .maybeSingle();

  if (userData?.locked_until) {
    const lockedUntil = new Date(userData.locked_until);
    if (lockedUntil > new Date()) {
      return {
        error: 'Account temporarily locked. Try again in 15 minutes.',
      };
    }
  }

  // Attempt sign in
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (authError) {
    // Only track failed attempts if user exists in public table
    if (userData) {
      const newAttempts = (userData.failed_login_attempts || 0) + 1;
      const updateData: { failed_login_attempts: number; locked_until?: string } = {
        failed_login_attempts: newAttempts,
      };

      if (newAttempts >= 5) {
        const lockUntil = new Date();
        lockUntil.setMinutes(lockUntil.getMinutes() + 15);
        updateData.locked_until = lockUntil.toISOString();
      }

      await supabase
        .from('users')
        .update(updateData)
        .eq('email', email);
    }

    return { error: 'Invalid email or password' };
  }

  // Successful login — reset failed attempts if user exists in public table
  if (userData) {
    await supabase
      .from('users')
      .update({ failed_login_attempts: 0, locked_until: null })
      .eq('email', email);
  } else {
    // Create the public.users record if it doesn't exist
    const role = authData.user?.user_metadata?.role as UserRole ?? 'client';
    await supabase.from('users').insert({
      id: authData.user.id,
      email: email,
      role: role,
      failed_login_attempts: 0,
    }).select().maybeSingle(); // ignore errors (might already exist)
  }

  // Get user role from metadata
  const role = (authData.user?.user_metadata?.role as UserRole) ?? null;

  return { role: role ?? undefined };
}

/**
 * Log out the current user.
 */
export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Get the currently authenticated user and their role.
 */
export async function getCurrentUser(): Promise<{
  user: User | null;
  role: UserRole | null;
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, role: null };
  }

  // Try to get role from user metadata first
  const metadataRole = user.user_metadata?.role as UserRole | undefined;
  if (metadataRole) {
    return { user, role: metadataRole };
  }

  // Fallback: fetch role from users table
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  return { user, role: (userData?.role as UserRole) ?? null };
}

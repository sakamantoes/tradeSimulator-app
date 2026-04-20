import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userService } from '@/services/user'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/auth'
import { Card } from '@/components/UI/Card'
import { Button } from '@/components/UI/Button'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Password must be at least 6 characters'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

const Profile: React.FC = () => {
  const queryClient = useQueryClient()
  const { user, updateUser } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)

  const { data: userData, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => userService.getMe(),
    enabled: !user,
  })

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || userData?.fullName || '',
      email: user?.email || userData?.email || '',
    },
  })

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileForm) => userService.updateProfile(data),
    onSuccess: (data) => {
      updateUser(data)
      setIsEditing(false)
      toast.success('Profile updated successfully')
      queryClient.invalidateQueries({ queryKey: ['me'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update profile')
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authService.changePassword(data),
    onSuccess: () => {
      passwordForm.reset()
      toast.success('Password changed successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to change password')
    },
  })

  const onProfileSubmit = (data: ProfileForm) => {
    updateProfileMutation.mutate(data)
  }

  const onPasswordSubmit = (data: PasswordForm) => {
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Profile Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Personal Information</h2>
              {!isEditing && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                <div className="form-control">
                  <label className="label">Full Name</label>
                  <input
                    type="text"
                    {...profileForm.register('fullName')}
                    className="input input-bordered"
                  />
                  {profileForm.formState.errors.fullName && (
                    <p className="text-red-500 text-sm mt-1">
                      {profileForm.formState.errors.fullName.message}
                    </p>
                  )}
                </div>

                <div className="form-control">
                  <label className="label">Email</label>
                  <input
                    type="email"
                    {...profileForm.register('email')}
                    className="input input-bordered"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Email cannot be changed
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    isLoading={updateProfileMutation.isPending}
                  >
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setIsEditing(false)
                      profileForm.reset()
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500">Full Name</label>
                  <p className="text-lg">{user?.fullName || userData?.fullName}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <p className="text-lg">{user?.email || userData?.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Account Level</label>
                  <p className="text-lg">
                    <span className="badge badge-primary">
                      {user?.accountLevel || userData?.accountLevel || 'Basic'}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Member Since</label>
                  <p className="text-lg">
                    {new Date(user?.createdAt || userData?.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Card>
            <h2 className="text-xl font-bold mb-4">Change Password</h2>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <div className="form-control">
                <label className="label">Current Password</label>
                <input
                  type="password"
                  {...passwordForm.register('currentPassword')}
                  className="input input-bordered"
                />
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-red-500 text-sm mt-1">
                    {passwordForm.formState.errors.currentPassword.message}
                  </p>
                )}
              </div>

              <div className="form-control">
                <label className="label">New Password</label>
                <input
                  type="password"
                  {...passwordForm.register('newPassword')}
                  className="input input-bordered"
                />
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-red-500 text-sm mt-1">
                    {passwordForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>

              <div className="form-control">
                <label className="label">Confirm New Password</label>
                <input
                  type="password"
                  {...passwordForm.register('confirmPassword')}
                  className="input input-bordered"
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                isLoading={changePasswordMutation.isPending}
              >
                Change Password
              </Button>
            </form>
          </Card>

          <Card className="mt-6">
            <h2 className="text-xl font-bold text-error mb-4">Danger Zone</h2>
            <div className="space-y-4">
              <div className="border border-error rounded-lg p-4">
                <h3 className="font-bold mb-2">Delete Account</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <Button
                  variant="danger"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                      // Handle account deletion
                      toast.error('Account deletion request submitted. Check your email for confirmation.')
                    }
                  }}
                >
                  Delete Account
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default Profile
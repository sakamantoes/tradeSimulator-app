import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { withdrawalService } from '@/services/withdrawal'
import { userService } from '@/services/user'
import { Card } from '@/components/UI/Card'
import { Button } from '@/components/UI/Button'
import { useNavigate } from '@tanstack/react-router'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

const withdrawalSchema = z.object({
  amount: z.number()
    .min(30, 'Minimum withdrawal is $30')
    .max(10000, 'Maximum withdrawal is $10,000'),
  currency: z.enum(['USDT', 'BTC', 'ETH']),
  walletAddress: z.string()
    .min(26, 'Invalid wallet address')
    .max(62, 'Invalid wallet address'),
})

type WithdrawalForm = z.infer<typeof withdrawalSchema>

const Withdraw: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => userService.getWallet(),
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<WithdrawalForm>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: 30,
      currency: 'USDT',
      walletAddress: '',
    },
  })

  const withdrawalMutation = useMutation({
    mutationFn: withdrawalService.requestWithdrawal,
    onSuccess: () => {
      toast.success('Withdrawal request submitted successfully!')
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] })
      navigate({ to: '/withdrawals' })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit withdrawal request')
    },
  })

  const onSubmit = (data: WithdrawalForm) => {
    if (wallet && data.amount > wallet.balance) {
      toast.error('Insufficient balance')
      return
    }
    withdrawalMutation.mutate(data)
  }

  const amount = watch('amount')
  const withdrawalFee = amount * 0.005 // 0.5%
  const netAmount = amount - withdrawalFee

  if (walletLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <h2 className="text-2xl font-bold mb-4">Withdraw Funds</h2>
          <p className="text-gray-500 mb-6">
            Minimum withdrawal: $30 | Withdrawal fee: 0.5%
          </p>

          <div className="alert alert-info mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>Available Balance: <strong className="text-lg">${wallet?.balance.toFixed(2)}</strong></span>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="form-control">
              <label className="label">Amount (USD)</label>
              <input
                type="number"
                {...register('amount', { valueAsNumber: true })}
                className="input input-bordered"
                placeholder="Enter amount"
                step="1"
              />
              {errors.amount && (
                <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
              )}
              <div className="flex justify-end mt-1">
                <button
                  type="button"
                  className="text-xs text-primary"
                  onClick={() => setValue('amount', wallet?.balance || 0)}
                >
                  Max: ${wallet?.balance.toFixed(2)}
                </button>
              </div>
            </div>

            <div className="form-control">
              <label className="label">Cryptocurrency</label>
              <select
                {...register('currency')}
                className="select select-bordered"
              >
                <option value="USDT">USDT (Tether - TRC20/ERC20)</option>
                <option value="BTC">Bitcoin (BTC)</option>
                <option value="ETH">Ethereum (ETH)</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label">Wallet Address</label>
              <input
                type="text"
                {...register('walletAddress')}
                className="input input-bordered"
                placeholder="Enter your wallet address"
              />
              {errors.walletAddress && (
                <p className="text-red-500 text-sm mt-1">{errors.walletAddress.message}</p>
              )}
            </div>

            <div className="bg-base-300 p-4 rounded-lg space-y-2">
              <h3 className="font-bold mb-2">Withdrawal Summary</h3>
              <div className="flex justify-between text-sm">
                <span>Withdrawal Amount:</span>
                <span>${amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Withdrawal Fee (0.5%):</span>
                <span>-${withdrawalFee.toFixed(2)}</span>
              </div>
              <div className="divider my-1"></div>
              <div className="flex justify-between font-bold">
                <span>You Will Receive:</span>
                <span className="text-success">${netAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="alert alert-warning">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Withdrawals are processed within 24-48 hours after approval.</span>
            </div>

            <Button
              type="submit"
              className="w-full"
              isLoading={withdrawalMutation.isPending}
              disabled={!wallet || amount > wallet.balance}
            >
              {!wallet || amount > wallet.balance ? 'Insufficient Balance' : 'Request Withdrawal'}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate({ to: '/withdrawals' })}
              >
                View Withdrawal History
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}

export default Withdraw
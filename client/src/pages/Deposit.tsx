import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { depositService } from '@/services/deposit'
import { Card } from '@/components/UI/Card'
import { Button } from '@/components/UI/Button'
import { useNavigate } from '@tanstack/react-router'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { CopyToClipboard } from 'react-copy-to-clipboard'

const depositSchema = z.object({
  amount: z.number()
    .min(20, 'Minimum deposit is $20')
    .max(1000, 'Maximum deposit is $1000'),
  currency: z.enum(['USDT', 'BTC', 'ETH']),
})

type DepositForm = z.infer<typeof depositSchema>

const Deposit: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [paymentInfo, setPaymentInfo] = useState<any>(null)
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<DepositForm>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amount: 20,
      currency: 'USDT',
    },
  })

  const depositMutation = useMutation({
    mutationFn: depositService.createDeposit,
    onSuccess: (data) => {
      setPaymentInfo(data.payment)
      toast.success('Deposit initiated! Please send funds to the address below.')
      queryClient.invalidateQueries({ queryKey: ['deposits'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create deposit')
    },
  })

  const onSubmit = (data: DepositForm) => {
    depositMutation.mutate(data)
  }

  const amount = watch('amount')
  const currency = watch('currency')
  
  const platformFee = amount * 0.001 // 0.1%
  const companyFee = amount * 0.01 // 1%
  const netAmount = amount - platformFee - companyFee

  if (paymentInfo) {
    return (
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <h2 className="text-2xl font-bold mb-4 text-success">Deposit Instructions</h2>
            <div className="space-y-4">
              <div className="alert alert-info">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>Please send exactly <strong>{paymentInfo.pay_amount} {paymentInfo.pay_currency}</strong> to the address below.</span>
              </div>

              <div className="form-control">
                <label className="label">Amount to Send</label>
                <div className="text-2xl font-mono font-bold">
                  {paymentInfo.pay_amount} {paymentInfo.pay_currency}
                </div>
              </div>

              <div className="form-control">
                <label className="label">Deposit Address</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={paymentInfo.pay_address}
                    readOnly
                    className="input input-bordered flex-1 font-mono text-sm"
                  />
                  <CopyToClipboard
                    text={paymentInfo.pay_address}
                    onCopy={() => toast.success('Address copied to clipboard')}
                  >
                    <Button variant="secondary">
                      Copy
                    </Button>
                  </CopyToClipboard>
                </div>
              </div>

              <div className="alert alert-warning">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Your balance will be updated automatically once the transaction is confirmed.</span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onClick={() => navigate({ to: '/deposits' })}
                >
                  View Deposit History
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setPaymentInfo(null)
                    window.location.reload()
                  }}
                >
                  Make Another Deposit
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
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
          <h2 className="text-2xl font-bold mb-4">Deposit Funds</h2>
          <p className="text-gray-500 mb-6">
            Minimum deposit: $20 | Maximum deposit: $1000
          </p>

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

            <div className="bg-base-300 p-4 rounded-lg space-y-2">
              <h3 className="font-bold mb-2">Fee Breakdown</h3>
              <div className="flex justify-between text-sm">
                <span>Deposit Amount:</span>
                <span>${amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Platform Fee (0.1%):</span>
                <span>-${platformFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Company Fee (1%):</span>
                <span>-${companyFee.toFixed(2)}</span>
              </div>
              <div className="divider my-1"></div>
              <div className="flex justify-between font-bold">
                <span>You Will Receive:</span>
                <span className="text-success">${netAmount.toFixed(2)}</span>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              isLoading={depositMutation.isPending}
            >
              Proceed to Payment
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate({ to: '/deposits' })}
              >
                View Deposit History
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}

export default Deposit
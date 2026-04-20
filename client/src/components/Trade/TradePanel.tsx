import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { tradeService } from '@/services/trade';
import { useMarketData } from '@/hooks/useMarketData';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Info, 
  Zap,
  Shield,
  Clock,
  DollarSign,
  Percent
} from 'lucide-react';
import { AssetSelector } from './AssetSelector';
import { formatCurrency } from '@/utils/formatters';

const tradeSchema = z.object({
  amount: z.number()
    .min(1, 'Minimum trade amount is $1')
    .max(10000, 'Maximum trade amount is $10,000'),
  prediction: z.enum(['UP', 'DOWN']),
  duration: z.number()
    .min(1, 'Minimum duration is 1 minute')
    .max(10, 'Maximum duration is 10 minutes'),
  useMultiplier: z.boolean().optional(),
  multiplier: z.number().min(1).max(5).optional(),
  stopLoss: z.number().min(0).optional(),
  takeProfit: z.number().min(0).optional(),
});

type TradeForm = z.infer<typeof tradeSchema>;

interface TradePanelProps {
  balance: number;
  onTradeSuccess?: () => void;
}

export const TradePanel: React.FC<TradePanelProps> = ({ balance, onTradeSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [riskWarning, setRiskWarning] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { selectedAsset, currentPrice, assets, setSelectedAsset } = useMarketData();
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<TradeForm>({
    resolver: zodResolver(tradeSchema),
    defaultValues: {
      amount: 10,
      prediction: 'UP',
      duration: 1,
      useMultiplier: false,
      multiplier: 1,
      stopLoss: 0,
      takeProfit: 0,
    },
  });

  const amount = watch('amount');
  const prediction = watch('prediction');
  const duration = watch('duration');
  const useMultiplier = watch('useMultiplier');
  const multiplier = watch('multiplier') || 1;
  const stopLoss = watch('stopLoss') || 0;
  const takeProfit = watch('takeProfit') || 0;

  // Calculate potential profit/loss
  const baseProfitPercentage = 0.10; // 10%
  const effectiveProfitPercentage = baseProfitPercentage * multiplier;
  const potentialProfit = amount * effectiveProfitPercentage;
  const totalPayout = amount + potentialProfit;
  const riskAmount = stopLoss > 0 ? Math.min(amount, stopLoss) : amount;
  
  // Risk percentage
  const riskPercentage = (riskAmount / balance) * 100;

  // Validate risk
  useEffect(() => {
    if (riskPercentage > 10) {
      setRiskWarning(`⚠️ High risk: This trade risks ${riskPercentage.toFixed(1)}% of your balance`);
    } else if (riskPercentage > 5) {
      setRiskWarning(`⚠️ Medium risk: This trade risks ${riskPercentage.toFixed(1)}% of your balance`);
    } else if (riskPercentage > 0) {
      setRiskWarning(`✅ Low risk: This trade risks ${riskPercentage.toFixed(1)}% of your balance`);
    } else {
      setRiskWarning(null);
    }
  }, [riskPercentage]);

  const onSubmit = async (data: TradeForm) => {
    if (!user) {
      toast.error('Please login to trade');
      return;
    }

    if (data.amount > balance) {
      toast.error('Insufficient balance');
      return;
    }

    setIsSubmitting(true);
    try {
      await tradeService.openTrade({
        asset: selectedAsset,
        amount: data.amount,
        prediction: data.prediction,
        duration: data.duration,
      });
      
      toast.success('Trade opened successfully!');
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['trade-stats'] });
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      
      // Reset form
      setValue('amount', 10);
      setValue('prediction', 'UP');
      setValue('duration', 1);
      setValue('useMultiplier', false);
      setValue('multiplier', 1);
      setValue('stopLoss', 0);
      setValue('takeProfit', 0);
      
      onTradeSuccess?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to open trade');
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickAmounts = [10, 50, 100, 500, 1000];

  const setQuickAmount = (amt: number) => {
    setValue('amount', Math.min(amt, balance));
  };

  const setPercentageAmount = (percentage: number) => {
    setValue('amount', Math.min((balance * percentage) / 100, balance));
  };

  return (
    <div className="card bg-base-200 sticky top-24">
      <div className="card-body p-6">
        <h2 className="text-2xl font-bold mb-4">Place a Trade</h2>
        
        {/* Asset Selector */}
        <AssetSelector
          assets={assets}
          selectedAsset={selectedAsset}
          onAssetChange={setSelectedAsset}
        />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {/* Amount Input */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Amount ($)</span>
              <span className="label-text-alt text-primary">
                Balance: {formatCurrency(balance)}
              </span>
            </label>
            <input
              type="number"
              {...register('amount', { valueAsNumber: true })}
              className={`input input-bordered ${errors.amount ? 'input-error' : ''}`}
              step="1"
              min="1"
              max={balance}
            />
            {errors.amount && (
              <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
            )}
            
            {/* Quick amount buttons */}
            <div className="flex flex-wrap gap-2 mt-2">
              {quickAmounts.map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setQuickAmount(amt)}
                  className="btn btn-xs btn-ghost"
                  disabled={amt > balance}
                >
                  ${amt}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPercentageAmount(25)}
                className="btn btn-xs btn-ghost"
              >
                25%
              </button>
              <button
                type="button"
                onClick={() => setPercentageAmount(50)}
                className="btn btn-xs btn-ghost"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => setPercentageAmount(100)}
                className="btn btn-xs btn-ghost"
                disabled={balance === 0}
              >
                Max
              </button>
            </div>
          </div>

          {/* Prediction Buttons */}
          <div className="form-control">
            <label className="label">Prediction</label>
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => setValue('prediction', 'UP')}
                className={`btn btn-lg ${prediction === 'UP' ? 'btn-success' : 'btn-outline'}`}
              >
                <TrendingUp className="w-5 h-5" />
                UP 📈
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => setValue('prediction', 'DOWN')}
                className={`btn btn-lg ${prediction === 'DOWN' ? 'btn-error' : 'btn-outline'}`}
              >
                <TrendingDown className="w-5 h-5" />
                DOWN 📉
              </motion.button>
            </div>
          </div>

          {/* Duration Slider */}
          <div className="form-control">
            <label className="label">Duration (minutes)</label>
            <input
              type="range"
              {...register('duration', { valueAsNumber: true })}
              className="range range-primary"
              min="1"
              max="10"
              step="1"
            />
            <div className="flex justify-between text-xs px-2">
              <span>1m</span>
              <span>2m</span>
              <span>3m</span>
              <span>5m</span>
              <span>10m</span>
            </div>
            <div className="text-center mt-2 font-bold">
              {duration} minute{duration !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Advanced Options Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="btn btn-sm btn-ghost w-full gap-2"
          >
            <Zap className="w-4 h-4" />
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </button>

          {/* Advanced Options */}
          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-4 overflow-hidden"
              >
                {/* Multiplier Mode */}
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      {...register('useMultiplier')}
                      className="checkbox checkbox-primary"
                    />
                    <span className="label-text">Multiplier Mode</span>
                    <div className="tooltip" data-tip="Increase your profit multiplier with higher risk">
                      <Info className="w-4 h-4 text-base-content/60" />
                    </div>
                  </label>
                  
                  {useMultiplier && (
                    <div className="mt-2">
                      <label className="label">Multiplier (x1 - x5)</label>
                      <input
                        type="range"
                        {...register('multiplier', { valueAsNumber: true })}
                        className="range range-secondary"
                        min="1"
                        max="5"
                        step="1"
                      />
                      <div className="flex justify-between text-xs px-2">
                        <span>x1</span>
                        <span>x2</span>
                        <span>x3</span>
                        <span>x4</span>
                        <span>x5</span>
                      </div>
                      <div className="text-center mt-2 font-bold text-secondary">
                        {multiplier}x Multiplier
                      </div>
                    </div>
                  )}
                </div>

                {/* Stop Loss */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Stop Loss ($)</span>
                    <span className="label-text-alt">Optional</span>
                  </label>
                  <input
                    type="number"
                    {...register('stopLoss', { valueAsNumber: true })}
                    className="input input-bordered"
                    placeholder="0 = No stop loss"
                    min="0"
                    max={amount}
                  />
                </div>

                {/* Take Profit */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Take Profit ($)</span>
                    <span className="label-text-alt">Optional</span>
                  </label>
                  <input
                    type="number"
                    {...register('takeProfit', { valueAsNumber: true })}
                    className="input input-bordered"
                    placeholder="0 = No take profit"
                    min="0"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Risk Warning */}
          {riskWarning && (
            <div className={`alert ${riskWarning.includes('Low') ? 'alert-success' : riskWarning.includes('Medium') ? 'alert-warning' : 'alert-error'} p-3`}>
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{riskWarning}</span>
            </div>
          )}

          {/* Profit/Loss Preview */}
          <div className="bg-base-300 p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-base-content/60" />
                <span className="text-sm">Investment:</span>
              </div>
              <span className="font-bold">{formatCurrency(amount)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-base-content/60" />
                <span className="text-sm">Profit Rate:</span>
              </div>
              <span className="font-bold text-green-500">
                {effectiveProfitPercentage * 100}%
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm">Potential Profit:</span>
              </div>
              <span className="font-bold text-green-500">
                +{formatCurrency(potentialProfit)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                <span className="text-sm">Risk if Loss:</span>
              </div>
              <span className="font-bold text-red-500">
                -{formatCurrency(riskAmount)}
              </span>
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t border-base-200">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold">Total Payout if Win:</span>
              </div>
              <span className="font-bold text-lg text-primary">
                {formatCurrency(amount + potentialProfit)}
              </span>
            </div>
          </div>

          {/* Timer Preview */}
          <div className="flex items-center justify-center gap-2 text-sm text-base-content/60">
            <Clock className="w-4 h-4" />
            <span>Trade will close in {duration} minute{duration !== 1 ? 's' : ''}</span>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            whileTap={{ scale: 0.98 }}
            className={`btn btn-primary w-full btn-lg ${isSubmitting ? 'loading' : ''}`}
            disabled={isSubmitting || amount > balance}
          >
            {isSubmitting ? 'Opening Trade...' : amount > balance ? 'Insufficient Balance' : 'Open Trade'}
          </motion.button>
        </form>

        {/* Info Footer */}
        <div className="mt-4 text-xs text-center text-base-content/60 space-y-1">
          <p>⚠️ Simulated trading - No real money involved</p>
          <p>💡 10% profit on winning trades</p>
          <p>⏱️ Trades auto-close after selected duration</p>
        </div>
      </div>
    </div>
  );
};
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { userService } from '@/services/user'
import { tradeService } from '@/services/trade'
import { BalanceCard } from '@/components/Dashboard/BalanceCard'
import { StatsCard } from '@/components/Dashboard/StatsCard'
import { RecentTrades } from '@/components/Dashboard/RecentTrades'
import { PriceChart } from '@/components/Charts/PriceChart'
import { useMarketData } from '@/hooks/useMarketData'
import { motion } from 'framer-motion'

const Dashboard: React.FC = () => {
  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => userService.getWallet(),
  })

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['trade-stats'],
    queryFn: () => tradeService.getTradeStats(),
  })

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => userService.getTransactions(),
  })

  const { selectedAsset, currentPrice, setSelectedAsset } = useMarketData()

  if (walletLoading || statsLoading || transactionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <BalanceCard
          title="Balance"
          amount={wallet?.balance || 0}
          change={stats?.netProfit || 0}
        />
        <BalanceCard
          title="Total Deposits"
          amount={wallet?.totalDeposits || 0}
        />
        <BalanceCard
          title="Total Withdrawals"
          amount={wallet?.totalWithdrawals || 0}
        />
        <StatsCard
          title="Win Rate"
          value={`${stats?.winRate || 0}%`}
          subtitle={`${stats?.wins || 0} Wins / ${stats?.losses || 0} Losses`}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 20 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <div className="lg:col-span-2">
          <PriceChart
            symbol={selectedAsset}
            currentPrice={currentPrice}
            onAssetChange={setSelectedAsset}
          />
        </div>
        <div className="space-y-6">
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="card-title">Quick Stats</h3>
              <div className="stats stats-vertical shadow">
                <div className="stat">
                  <div className="stat-title">Total Trades</div>
                  <div className="stat-value">{stats?.totalTrades || 0}</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Net Profit</div>
                  <div className={`stat-value ${(stats?.netProfit || 0) >= 0 ? 'text-success' : 'text-error'}`}>
                    ${(stats?.netProfit || 0).toFixed(2)}
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-title">Account Level</div>
                  <div className="stat-value text-primary">Basic</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 40 }}
        transition={{ delay: 0.2 }}
      >
        <RecentTrades trades={transactions?.filter(t => t.type === 'trade') || []} />
      </motion.div>
    </div>
  )
}

export default Dashboard
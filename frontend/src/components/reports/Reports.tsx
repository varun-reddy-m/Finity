import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { RangeSwitch } from '../dashboard/RangeSwitch';
import { useApp } from '../../contexts/AppContext';
import { Bar, Pie, Line } from 'react-chartjs-2';
import 'chart.js/auto';

interface SummaryItem {
  type: string;
  total: number;
}

interface CategoryItem {
  category_id: number;
  total: number;
}

interface DayItem {
  day: string;
  total: number;
}

export function Reports() {
  const { timeRange, setTimeRange, transactions } = useApp();
  const [summary, setSummary] = useState<SummaryItem[]>([]);
  const [byCategory, setByCategory] = useState<CategoryItem[]>([]);
  const [byDay, setByDay] = useState<DayItem[]>([]);
  const [chartData, setChartData] = useState<{
    summary: { labels: string[]; datasets: { label: string; data: number[]; backgroundColor: string[] }[] };
    byCategory: { labels: string[]; datasets: { label: string; data: number[]; backgroundColor: string[] }[] };
    byDay: { labels: string[]; datasets: { label: string; data: number[]; backgroundColor: string[] }[] };
  }>({
    summary: { labels: [], datasets: [] },
    byCategory: { labels: [], datasets: [] },
    byDay: { labels: [], datasets: [] },
  });

  useEffect(() => {
    if (!transactions || transactions.length === 0) {
      setChartData({
        summary: { labels: [], datasets: [] },
        byCategory: { labels: [], datasets: [] },
        byDay: { labels: [], datasets: [] },
      });
      return;
    }

    // Filter transactions based on the selected time range
    const filteredTransactions = transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      const now = new Date();

      if (timeRange === 'yearly') {
        return transactionDate.getFullYear() === now.getFullYear();
      } else if (timeRange === 'monthly') {
        return (
          transactionDate.getFullYear() === now.getFullYear() &&
          transactionDate.getMonth() === now.getMonth()
        );
      } else if (timeRange === 'weekly') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return transactionDate >= oneWeekAgo && transactionDate <= now;
      }
      return true;
    });

    // Process filtered transactions data
    const summaryData: SummaryItem[] = [
      { type: 'Income', total: filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) },
      { type: 'Expense', total: filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) },
    ];

    const uniqueColors = [
      '#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#A133FF', '#33FFF5', '#F5FF33', '#FF8C33', '#8C33FF', '#33FF8C'
    ];

    const byCategoryData: CategoryItem[] = filteredTransactions.reduce((acc: CategoryItem[], t) => {
      const category = acc.find(c => c.category_id === t.category_id);
      if (category) {
        category.total += t.amount;
      } else {
        acc.push({ category_id: t.category_id || 0, total: t.amount });
      }
      return acc;
    }, []);

    const categoryLabels = byCategoryData.map(item => {
      const category = transactions.find(t => t.category_id === item.category_id);
      return category ? category.category : `Category ${item.category_id}`;
    });

    const byDayData: DayItem[] = filteredTransactions.reduce((acc: DayItem[], t) => {
      const day = acc.find(d => d.day === t.date);
      if (day) {
        day.total += t.amount;
      } else {
        acc.push({ day: t.date, total: t.amount });
      }
      return acc;
    }, []);

    const incomeData = filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((acc: DayItem[], t) => {
        const day = acc.find((d) => d.day === t.date);
        if (day) {
          day.total += t.amount;
        } else {
          acc.push({ day: t.date, total: t.amount });
        }
        return acc;
      }, []);

    const expenseData = filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((acc: DayItem[], t) => {
        const day = acc.find((d) => d.day === t.date);
        if (day) {
          day.total += t.amount;
        } else {
          acc.push({ day: t.date, total: t.amount });
        }
        return acc;
      }, []);

    const balanceData = filteredTransactions.reduce((acc: DayItem[], t) => {
      const day = acc.find((d) => d.day === t.date);
      if (day) {
        day.total += t.type === 'income' ? t.amount : -t.amount;
      } else {
        acc.push({ day: t.date, total: t.type === 'income' ? t.amount : -t.amount });
      }
      return acc;
    }, []);

    setSummary(summaryData);
    setByCategory(byCategoryData);
    setByDay(byDayData);

    // Prepare chart data
    setChartData({
      summary: {
        labels: summaryData.map(item => item.type),
        datasets: [
          {
            label: 'Summary',
            data: summaryData.map(item => item.total),
            backgroundColor: ['#4CAF50', '#FF9800', '#F44336'],
          },
        ],
      },
      byCategory: {
        labels: categoryLabels,
        datasets: [
          {
            label: 'By Category',
            data: byCategoryData.map(item => item.total),
            backgroundColor: uniqueColors.slice(0, byCategoryData.length),
          },
        ],
      },
      byDay: {
        labels: byDayData.map((item) => item.day),
        datasets: [
          {
            label: `Income (${timeRange})`,
            data: incomeData.map((item) => item.total),
            borderColor: ['green'],
            backgroundColor: ['rgba(0, 255, 0, 0.2)'],
            pointBackgroundColor: 'green',
            fill: false,
          },
          {
            label: `Expense (${timeRange})`,
            data: expenseData.map((item) => item.total),
            borderColor: ['red'],
            backgroundColor: ['rgba(255, 0, 0, 0.2)'],
            pointBackgroundColor: 'red',
            fill: false,
          },
        ],
        options: {
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function (value: number) {
                  return value.toLocaleString();
                },
              },
            },
          },
        },
      },
      balance: {
        labels: balanceData.map((item) => item.day),
        datasets: [
          {
            label: `Net Balance (${timeRange})`,
            data: balanceData.map((item) => item.total),
            borderColor: ['blue'],
            backgroundColor: ['rgba(0, 0, 255, 0.2)'],
            pointBackgroundColor: 'blue',
            fill: false,
          },
        ],
        options: {
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function (value: number) {
                  return value.toLocaleString();
                },
              },
            },
          },
        },
      },
    });
  }, [transactions, timeRange, summary, byCategory, byDay]);

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-100 mb-2">
              Financial Reports
            </h2>
            <p className="text-gray-400">
              Comprehensive insights into your financial patterns
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="overflow-hidden rounded-lg shadow-md bg-gray-800 p-4">
            <h2 className="text-xl font-bold text-gray-100 mb-4">Summary Chart</h2>
            {chartData.summary.labels && chartData.summary.datasets ? (
              <Bar data={chartData.summary as any} options={{ maintainAspectRatio: true, responsive: true }} height={200} />
            ) : (
              <p className="text-gray-400">No data available for Summary Chart</p>
            )}
          </div>

          <div className="overflow-hidden rounded-lg shadow-md bg-gray-800 p-4">
            <h2 className="text-xl font-bold text-gray-100 mb-4">By Category Chart</h2>
            {chartData.byCategory.labels && chartData.byCategory.datasets ? (
              <Pie data={chartData.byCategory as any} options={{ maintainAspectRatio: true, responsive: true }} height={200} />
            ) : (
              <p className="text-gray-400">No data available for By Category Chart</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="overflow-hidden rounded-lg shadow-md bg-gray-800 p-4">
            <h2 className="text-xl font-bold text-gray-100 mb-4">By Day Chart</h2>
            {chartData.byDay.labels && chartData.byDay.datasets ? (
              <Line data={chartData.byDay as any} options={{ maintainAspectRatio: true, responsive: true }} height={200} />
            ) : (
              <p className="text-gray-400">No data available for By Day Chart</p>
            )}
          </div>

          <div className="space-y-4 overflow-hidden rounded-lg shadow-md bg-gray-800 p-4">
            <h2 className="text-xl font-bold text-gray-100 mb-4">Advanced Filters</h2>
            <div className="flex space-x-4">
              <input
                type="date"
                className="px-3 py-2 border border-gray-600 rounded-xl bg-gray-800 text-gray-100"
                placeholder="Start Date"
              />
              <input
                type="date"
                className="px-3 py-2 border border-gray-600 rounded-xl bg-gray-800 text-gray-100"
                placeholder="End Date"
              />
              <select
                className="px-3 py-2 border border-gray-600 rounded-xl bg-gray-800 text-gray-100"
              >
                <option value="">All Categories</option>
                {byCategory.map((item, index) => (
                  <option key={index} value={item.category_id}>
                    {item.category_id}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
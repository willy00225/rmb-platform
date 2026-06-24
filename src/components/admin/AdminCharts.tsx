"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface Props {
  donationsByMonth: { month: string; total: number }[];
  membersByMonth: { month: string; count: number }[];
}

export function AdminCharts({ donationsByMonth, membersByMonth }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Dons (6 derniers mois)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={donationsByMonth}>
            <XAxis dataKey="month" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip />
            <Bar dataKey="total" fill="#f58800" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Inscriptions (6 derniers mois)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={membersByMonth}>
            <XAxis dataKey="month" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

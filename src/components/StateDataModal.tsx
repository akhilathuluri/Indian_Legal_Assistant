import React from 'react';
import { X } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface StateDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  stateData: any;
}

export default function StateDataModal({ isOpen, onClose, stateData }: StateDataModalProps) {
  if (!isOpen || !stateData) return null;

  const chartData = [2016, 2017, 2018, 2019, 2020].map(year => ({
    year,
    cases: parseFloat(stateData[`${year} - CR`]) || 0,
    rate: parseFloat(stateData[`${year} - Rate`]) || 0
  }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{stateData['State/UT']}</h2>
            <p className="text-sm text-gray-500">Crime Statistics (2016-2020)</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="h-80 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="cases"
                  name="Total Cases"
                  stroke="#4f46e5"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="rate"
                  name="Crime Rate"
                  stroke="#ef4444"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Total Cases</h3>
              <table className="w-full">
                <tbody>
                  {[2016, 2017, 2018, 2019, 2020].map(year => (
                    <tr key={year} className="border-b last:border-0">
                      <td className="py-2">{year}</td>
                      <td className="py-2 text-right font-medium">
                        {parseFloat(stateData[`${year} - CR`]).toLocaleString() || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Crime Rate</h3>
              <table className="w-full">
                <tbody>
                  {[2016, 2017, 2018, 2019, 2020].map(year => (
                    <tr key={year} className="border-b last:border-0">
                      <td className="py-2">{year}</td>
                      <td className="py-2 text-right font-medium">
                        {parseFloat(stateData[`${year} - Rate`]).toFixed(1) || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

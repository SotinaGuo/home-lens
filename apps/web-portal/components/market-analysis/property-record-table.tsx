import { formatCurrency, formatNumber } from "@/lib/market-analysis/formatting";
import type { PropertyRecord } from "@/lib/market-analysis/types";

type PropertyRecordTableProps = {
  records: PropertyRecord[];
  title: string;
  emptyMessage: string;
};

export function PropertyRecordTable({
  records,
  title,
  emptyMessage
}: PropertyRecordTableProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-bold text-slate-950">{title}</h3>
      {records.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">{emptyMessage}</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2 pr-4 font-semibold">ID</th>
                <th className="py-2 pr-4 font-semibold">Price</th>
                <th className="py-2 pr-4 font-semibold">Sq ft</th>
                <th className="py-2 pr-4 font-semibold">Beds</th>
                <th className="py-2 pr-4 font-semibold">Baths</th>
                <th className="py-2 pr-4 font-semibold">School</th>
                <th className="py-2 pr-4 font-semibold">City distance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {records.map((record) => (
                <tr key={record.id}>
                  <td className="py-2 pr-4">{record.id}</td>
                  <td className="py-2 pr-4 font-semibold text-slate-950">
                    {formatCurrency(record.price)}
                  </td>
                  <td className="py-2 pr-4">{formatNumber(record.square_footage)}</td>
                  <td className="py-2 pr-4">{record.bedrooms}</td>
                  <td className="py-2 pr-4">{record.bathrooms}</td>
                  <td className="py-2 pr-4">{formatNumber(record.school_rating)}</td>
                  <td className="py-2 pr-4">
                    {formatNumber(record.distance_to_city_center)} mi
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

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
    <section className="surface-card p-5">
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      {records.length === 0 ? (
        <p className="empty-state mt-4">{emptyMessage}</p>
      ) : (
        <div className="table-wrap mt-4">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Price</th>
                <th>Sq ft</th>
                <th>Beds</th>
                <th>Baths</th>
                <th>School</th>
                <th>City distance</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td>{record.id}</td>
                  <td className="font-semibold text-slate-950">
                    {formatCurrency(record.price)}
                  </td>
                  <td>{formatNumber(record.square_footage)}</td>
                  <td>{record.bedrooms}</td>
                  <td>{record.bathrooms}</td>
                  <td>{formatNumber(record.school_rating)}</td>
                  <td>
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

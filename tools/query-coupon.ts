import "server-only";

import { listActivities, listCoupons } from "@/lib/catalog-repo";

export async function queryCoupon(keyword: string) {
  const needle = keyword.trim();
  if (!needle) {
    return [];
  }

  const coupons = await listCoupons();
  return coupons.items.filter((coupon) =>
    [coupon.id, coupon.name, coupon.code, coupon.type].some((value) =>
      value.includes(needle),
    ),
  );
}

export async function queryActivities(keyword: string) {
  const needle = keyword.trim();
  if (!needle) {
    return [];
  }

  const activities = await listActivities();
  return activities.items.filter((activity) =>
    [activity.id, activity.name, activity.type, activity.discountNote].some(
      (value) => value.includes(needle),
    ),
  );
}

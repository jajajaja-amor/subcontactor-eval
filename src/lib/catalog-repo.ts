import "server-only";

import {
  activitiesCollectionSchema,
  couponsCollectionSchema,
  faqCollectionSchema,
  logisticsCollectionSchema,
  ordersCollectionSchema,
  productsCollectionSchema,
  returnPoliciesCollectionSchema,
  usersCollectionSchema,
} from "@/lib/schemas";
import { readJson } from "@/lib/store";
import type {
  Activity,
  Collection,
  Coupon,
  Faq,
  LogisticsRecord,
  Order,
  Product,
  ReturnPolicy,
  User,
} from "@/lib/types";

export function listProducts(): Promise<Collection<Product>> {
  return readJson("products.json", productsCollectionSchema);
}

export function listActivities(): Promise<Collection<Activity>> {
  return readJson("activities.json", activitiesCollectionSchema);
}

export function listCoupons(): Promise<Collection<Coupon>> {
  return readJson("coupons.json", couponsCollectionSchema);
}

export function listOrders(): Promise<Collection<Order>> {
  return readJson("orders.json", ordersCollectionSchema);
}

export function listUsers(): Promise<Collection<User>> {
  return readJson("users.json", usersCollectionSchema);
}

export function listReturnPolicies(): Promise<Collection<ReturnPolicy>> {
  return readJson("return-policies.json", returnPoliciesCollectionSchema);
}

export function listLogistics(): Promise<Collection<LogisticsRecord>> {
  return readJson("logistics.json", logisticsCollectionSchema);
}

export function listFaqs(): Promise<Collection<Faq>> {
  return readJson("faq.json", faqCollectionSchema);
}

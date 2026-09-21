import "server-only";

import {
  activitiesCollectionSchema,
  contractsCollectionSchema,
  couponsCollectionSchema,
  faqCollectionSchema,
  handoffRulesCollectionSchema,
  logisticsCollectionSchema,
  ordersCollectionSchema,
  productsCollectionSchema,
  projectsCollectionSchema,
  qualificationsCollectionSchema,
  returnPoliciesCollectionSchema,
  subcontractorsCollectionSchema,
  usersCollectionSchema,
} from "@/lib/schemas";
import { readJson } from "@/lib/store";
import type {
  Activity,
  Collection,
  Contract,
  Coupon,
  Faq,
  HandoffRule,
  LogisticsRecord,
  Order,
  Product,
  Project,
  QualificationRecord,
  ReturnPolicy,
  Subcontractor,
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

export function listSubcontractors(): Promise<Collection<Subcontractor>> {
  return readJson("subcontractors.json", subcontractorsCollectionSchema);
}

export function listProjects(): Promise<Collection<Project>> {
  return readJson("projects.json", projectsCollectionSchema);
}

export function listContracts(): Promise<Collection<Contract>> {
  return readJson("contracts.json", contractsCollectionSchema);
}

export function listQualifications(): Promise<Collection<QualificationRecord>> {
  return readJson("qualifications.json", qualificationsCollectionSchema);
}

export function listHandoffRules(): Promise<Collection<HandoffRule>> {
  return readJson("handoff-rules.json", handoffRulesCollectionSchema);
}

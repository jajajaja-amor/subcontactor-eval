import "server-only";

import { listFaqs, listReturnPolicies } from "@/lib/catalog-repo";

export async function queryFaq(keyword: string) {
  const needle = keyword.trim();
  if (!needle) {
    return [];
  }

  const faqs = await listFaqs();
  return faqs.items.filter((faq) =>
    [faq.question, faq.answer, faq.category, ...faq.tags].some((value) =>
      value.includes(needle),
    ),
  );
}

export async function queryReturnPolicies(keyword: string) {
  const needle = keyword.trim();
  if (!needle) {
    return [];
  }

  const policies = await listReturnPolicies();
  return policies.items.filter((policy) =>
    [policy.name, policy.appliesTo, policy.summary, ...policy.steps].some(
      (value) => value.includes(needle),
    ),
  );
}

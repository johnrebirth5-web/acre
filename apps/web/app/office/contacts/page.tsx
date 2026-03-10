import { listContacts } from "@acre/db";
import { requireOfficeSession } from "../../../lib/auth-session";
import { ContactsClient } from "./contacts-client";

export default async function OfficeContactsPage() {
  const context = await requireOfficeSession();
  const result = await listContacts({
    organizationId: context.currentOrganization.id
  });

  return <ContactsClient contacts={result.contacts} totalCount={result.totalCount} />;
}

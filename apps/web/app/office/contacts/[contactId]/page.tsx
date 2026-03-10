import { getContactById } from "@acre/db";
import { notFound } from "next/navigation";
import { requireOfficeSession } from "../../../../lib/auth-session";
import { ContactDetailClient } from "./contact-detail-client";

type ContactDetailPageProps = {
  params: Promise<{
    contactId: string;
  }>;
};

export default async function OfficeContactDetailPage({ params }: ContactDetailPageProps) {
  const context = await requireOfficeSession();
  const { contactId } = await params;
  const contact = await getContactById(context.currentOrganization.id, contactId);

  if (!contact) {
    notFound();
  }

  return <ContactDetailClient contact={contact} />;
}

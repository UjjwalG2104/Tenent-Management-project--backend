import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

export const generateAgreementPdf = async ({ agreement, owner, tenant, property }) => {
  const storageDir = path.join(process.cwd(), "storage", "agreements");
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  const fileName = `agreement_${agreement._id}.pdf`;
  const filePath = path.join(storageDir, fileName);

  const doc = new PDFDocument();
  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);

  doc.fontSize(20).text("Residential Rental Agreement", { align: "center" });
  doc.moveDown();

  doc.fontSize(12).text(`Owner: ${owner.name} (${owner.email})`);
  doc.text(`Tenant: ${tenant.name} (${tenant.email})`);
  doc.moveDown();

  doc.text(`Property: ${property.title}`);
  doc.text(property.address);
  doc.text(`${property.city}, ${property.state} - ${property.pincode}`);
  doc.moveDown();

  doc.text(`Start Date: ${agreement.startDate.toDateString()}`);
  doc.text(`End Date: ${agreement.endDate.toDateString()}`);
  doc.text(`Monthly Rent: ₹${agreement.monthlyRent}`);
  doc.text(`Security Deposit: ₹${agreement.securityDeposit}`);
  doc.moveDown();

  doc.text(
    "Terms & Conditions: The tenant agrees to pay rent on time every month. Late payments may incur additional charges. Both parties agree to comply with local tenancy laws.",
    {
      align: "justify",
    }
  );

  doc.end();

  await new Promise((resolve, reject) => {
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
  });

  return filePath;
};


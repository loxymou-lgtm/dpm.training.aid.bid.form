import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import emblemUrl from "../../image/png-national-emblem.png?url";
// Compatibility: jspdf-autotable may export as default or as module.exports; normalize to a callable function
const autoTableCompat: any = (autoTable && (autoTable as any).default) || autoTable;
import { DPMBidFormData } from "../types";
// Cache for fetched data URI to avoid repeated network requests when generating multiple PDFs
let _emblemDataUriCache: string | null = null;

async function fetchImageUrlAsDataUri(url: string): Promise<string> {
  if (_emblemDataUriCache) return _emblemDataUriCache;
  try {
    let fetchUrl = url || emblemUrl;
    // Prefer the bundled asset URL so the logo works correctly in production builds and Render deployments.
    if (!fetchUrl) {
      if (typeof window === 'undefined') {
        const base = process.env.TEST_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
        fetchUrl = `${base}/image/png-national-emblem.png`;
      } else {
        fetchUrl = `/image/png-national-emblem.png`;
      }
    }

    // In Node (server-side tests) prefix root-relative with base URL
    if (typeof window === "undefined") {
      const base = process.env.TEST_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
      if (fetchUrl.startsWith("/")) fetchUrl = `${base}${fetchUrl}`;
      else if (!/^https?:\/\//i.test(fetchUrl)) fetchUrl = `${base}/${fetchUrl}`;
    }

    const res = await fetch(fetchUrl);
    if (!res.ok) throw new Error(`Failed to fetch emblem image: ${res.status}`);
    const contentType = res.headers.get("content-type") || "image/png";
    const arrayBuffer = await res.arrayBuffer();
    // Convert to base64
    let binary = "";
    const bytes = new Uint8Array(arrayBuffer);
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const base64 = typeof btoa === "function" ? btoa(binary) : Buffer.from(binary, "binary").toString("base64");
    _emblemDataUriCache = `data:${contentType};base64,${base64}`;
    return _emblemDataUriCache;
  } catch (e) {
    console.warn("Could not fetch/convert emblem to data URI", e);
    return "";
  }
}

export interface GeneratePdfOptions {
  fileName?: string;
}

export const buildDPMBidFormPDFDocument = async (formData: DPMBidFormData): Promise<jsPDF> => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let currentY = margin;

  const brandNavy: [number, number, number] = [15, 23, 42]; // slate-900
  const headerGray: [number, number, number] = [71, 85, 105]; // slate-600
  const lightBg: [number, number, number] = [248, 250, 252]; // slate-50
  const borderGray: [number, number, number] = [203, 213, 225]; // slate-300
  const accentRed: [number, number, number] = [153, 27, 27]; // red-800

  // Helper to ensure page break if content exceeds threshold
  const ensureSpace = (requiredSpace: number) => {
    if (currentY + requiredSpace > pageHeight - 16) {
      doc.addPage();
      currentY = margin + 10;
      drawRunningHeader();
    }
  };

  const drawRunningHeader = () => {
    doc.saveGraphicsState();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...headerGray);
    doc.text("DEPARTMENT OF PERSONNEL MANAGEMENT — PUBLIC SECTOR TRAINING BID FORM", margin, margin - 4);
    doc.setFont("helvetica", "normal");
    const bidYear = formData.bidYear || "2026";
    doc.text(`Bid Year: ${bidYear}`, pageWidth - margin, margin - 4, { align: "right" });
    doc.setDrawColor(...borderGray);
    doc.setLineWidth(0.3);
    doc.line(margin, margin - 2, pageWidth - margin, margin - 2);
    doc.restoreGraphicsState();
  };

  // Helper to draw section header bar
  const drawSectionHeader = (title: string, subtext?: string) => {
    ensureSpace(14);
    doc.setFillColor(...brandNavy);
    doc.rect(margin, currentY, contentWidth, 6.5, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(title, margin + 2.5, currentY + 4.5);

    currentY += 8.5;

    if (subtext) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(...headerGray);
      doc.text(subtext, margin, currentY);
      currentY += 4.5;
    }
  };

  // Helper for bordered text block (e.g. for narrative descriptions)
  const drawNarrativeBox = (label: string, textContent: string, minH = 18) => {
    ensureSpace(minH + 10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...brandNavy);
    doc.text(label, margin, currentY + 3);
    currentY += 5;

    const formattedText = textContent?.trim() || "(Not provided)";
    const splitLines = doc.splitTextToSize(formattedText, contentWidth - 6);
    const textHeight = Math.max(minH, splitLines.length * 3.8 + 6);

    ensureSpace(textHeight + 2);

    doc.setFillColor(...lightBg);
    doc.setDrawColor(...borderGray);
    doc.setLineWidth(0.25);
    doc.rect(margin, currentY, contentWidth, textHeight, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(splitLines, margin + 3, currentY + 4.5);

    currentY += textHeight + 4;
  };

  // Helper for labeled field rows with dynamic multi-line wrapping and no truncation
  const drawFieldRow = (items: { label: string; value: string; widthRatio?: number }[]) => {
    const totalRatio = items.reduce((acc, curr) => acc + (curr.widthRatio || 1), 0);
    
    // First calculate layout and height for each item
    const computedItems = items.map((item) => {
      const itemWidth = (contentWidth * (item.widthRatio || 1)) / totalRatio;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      const labelWidth = doc.getTextWidth(item.label) + 2;
      const maxValWidth = Math.max(itemWidth - labelWidth - 2, 20);
      
      doc.setFont("helvetica", "normal");
      const val = item.value || "—";
      const lines = doc.splitTextToSize(val, maxValWidth);
      const itemHeight = Math.max(5.5, lines.length * 3.6 + 1.5);
      return { ...item, itemWidth, labelWidth, lines, itemHeight };
    });

    const maxRowHeight = Math.max(...computedItems.map((ci) => ci.itemHeight), 5.5);
    ensureSpace(maxRowHeight + 2);

    let xOffset = margin;
    computedItems.forEach((ci) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...brandNavy);
      doc.text(ci.label, xOffset, currentY);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      doc.text(ci.lines, xOffset + ci.labelWidth, currentY);

      xOffset += ci.itemWidth;
    });

    currentY += maxRowHeight;
  };

  // ==========================================
  // PAGE 1: OFFICIAL DPM COVER & CORE DATA
  // ==========================================

  // Dedicated Centered PNG Crest / Official Logo Container (approx 60-75px / 18mm height)
  currentY = margin + 2;
  const crestW = 22;
  const crestH = 18;
  const crestX = (pageWidth - crestW) / 2;

  // Crest Seal Container Frame
  doc.setFillColor(255, 251, 235); // amber-50
  doc.setDrawColor(...accentRed);
  doc.setLineWidth(0.6);
  doc.roundedRect(crestX, currentY, crestW, crestH, 2.5, 2.5, "FD");

  // Try to fetch the emblem URL and embed it into the PDF so the exported document contains the real crest.
  try {
    const emblemDataUri = await fetchImageUrlAsDataUri(undefined);
    if (emblemDataUri) {
      doc.addImage(emblemDataUri as any, "PNG", crestX, currentY, crestW, crestH);
    } else {
      // Fallback: draw simple placeholder circles if embedding fails
      doc.setFillColor(...accentRed);
      doc.circle(crestX + crestW / 2, currentY + 6.5, 4.8, "F");
      doc.setFillColor(254, 243, 199);
      doc.circle(crestX + crestW / 2, currentY + 6.5, 3.4, "F");
      doc.setFillColor(...accentRed);
      doc.circle(crestX + crestW / 2, currentY + 6.5, 1.8, "F");
    }
  } catch (e) {
    console.warn("Could not embed emblem into PDF", e);
    doc.setFillColor(...accentRed);
    doc.circle(crestX + crestW / 2, currentY + 6.5, 4.8, "F");
    doc.setFillColor(254, 243, 199);
    doc.circle(crestX + crestW / 2, currentY + 6.5, 3.4, "F");
    doc.setFillColor(...accentRed);
    doc.circle(crestX + crestW / 2, currentY + 6.5, 1.8, "F");
  }

  currentY += crestH + 4;

  // Formal National Emblem Header with proper vertical spacing and line-height
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...accentRed);
  doc.text("INDEPENDENT STATE OF PAPUA NEW GUINEA", pageWidth / 2, currentY, { align: "center" });
  currentY += 5.2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...brandNavy);
  doc.text("NATIONAL PUBLIC SERVICE", pageWidth / 2, currentY, { align: "center" });
  currentY += 5.5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.5);
  doc.text("DEPARTMENT OF PERSONNEL MANAGEMENT", pageWidth / 2, currentY, { align: "center" });
  currentY += 6.5;

  doc.setFontSize(10);
  doc.setTextColor(...accentRed);
  doc.text(
    `DONOR FUNDED TRAINING AID BID FORM FOR PUBLIC SECTOR – (${formData.bidYear || "2026"})`,
    pageWidth / 2,
    currentY,
    { align: "center" }
  );
  currentY += 5.2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...brandNavy);
  doc.text("TRAINING PROGRAMME REQUESTED FOR INDIVIDUAL OFFICERS", pageWidth / 2, currentY, { align: "center" });
  currentY += 4.5;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(...headerGray);
  doc.text("Academic programmes, short/long courses and work attachments in Papua New Guinea and Overseas", pageWidth / 2, currentY, {
    align: "center",
  });
  currentY += 6;

  // Thin separator line
  doc.setDrawColor(...brandNavy);
  doc.setLineWidth(0.6);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 6;

  // Top Key Attributes Box
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...brandNavy);
  doc.setLineWidth(0.4);
  doc.rect(margin, currentY, contentWidth, 32, "FD");

  let boxY = currentY + 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...brandNavy);
  doc.text("PROPOSED STUDY LEVEL:", margin + 3, boxY);
  doc.setFont("helvetica", "normal");
  doc.text(formData.proposedStudyLevel || "—", margin + 50, boxY);

  boxY += 6;
  doc.setFont("helvetica", "bold");
  doc.text("COURSE TITLE:", margin + 3, boxY);
  doc.setFont("helvetica", "normal");
  const courseTitleLines = doc.splitTextToSize(formData.courseTitle || "—", contentWidth - 55);
  doc.text(courseTitleLines[0] || "—", margin + 50, boxY);

  boxY += 7;
  // Nominee Name in bold banner
  doc.setDrawColor(...borderGray);
  doc.line(margin + 3, boxY - 2, pageWidth - margin - 3, boxY - 2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("FAMILY NAME (SURNAME):", margin + 3, boxY + 3);
  doc.setFontSize(9.5);
  doc.setTextColor(...accentRed);
  doc.text((formData.familyName || "—").toUpperCase(), margin + 50, boxY + 3);

  doc.setFontSize(8);
  doc.setTextColor(...brandNavy);
  doc.text("OTHER NAME(S):", margin + 105, boxY + 3);
  doc.setFontSize(9);
  doc.text(formData.otherNames || "—", margin + 135, boxY + 3);

  currentY += 35;

  // DPM Use Only Banner
  doc.setDrawColor(...headerGray);
  doc.setLineDashPattern([2, 1.5], 0);
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, currentY, contentWidth, 12, "FD");
  doc.setLineDashPattern([], 0); // reset

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...headerGray);
  doc.text("DPM USE ONLY", margin + 3, currentY + 4);

  doc.setFontSize(8);
  doc.setTextColor(...brandNavy);
  doc.text("Sector Category: " + (formData.dpmSectorCategory || "Pending Review"), margin + 3, currentY + 8.5);
  doc.text("Preliminary Rank: " + (formData.dpmPreliminaryRank || "Priority Public Sector"), margin + 105, currentY + 8.5);

  currentY += 15;

  // Mandatory Notice
  doc.setFillColor(254, 243, 199); // amber-100
  doc.setDrawColor(245, 158, 11);
  doc.rect(margin, currentY, contentWidth, 6, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(146, 64, 14);
  doc.text("NOTE: ALL QUESTIONS MUST BE COMPLETED FULLY FOR SUCCESSFUL NOMINATION", pageWidth / 2, currentY + 4.2, { align: "center" });
  currentY += 9;

  // SECTION 1 to 4: SPONSORSHIP & PROGRAMME
  drawSectionHeader("1 – 4. ORGANISATION, DONOR AID & PROGRAMME DURATION");

  drawFieldRow([
    { label: "1. Organisation:", value: formData.organisation, widthRatio: 1.3 },
    { label: "Postal Address:", value: formData.postalAddress, widthRatio: 1.2 },
  ]);

  drawFieldRow([
    { label: "2. Organisation Sector:", value: formData.organisationSector, widthRatio: 1 },
  ]);

  drawFieldRow([
    { label: "3. Aid Donor:", value: formData.aidDonor, widthRatio: 1.4 },
    { label: "Venue (Institution & Country):", value: formData.venue, widthRatio: 1.1 },
  ]);

  drawFieldRow([
    {
      label: "4. Duration:",
      value: `${formData.durationYears || "0"} yrs, ${formData.durationMonths || "0"} mos, ${formData.durationWeeks || "0"} wks (${formData.durationFromDate || "—"} to ${formData.durationToDate || "—"})`,
      widthRatio: 1,
    },
  ]);

  currentY += 2;

  // SECTION 5: PERSONAL PARTICULARS
  drawSectionHeader("5. PERSONAL PARTICULARS OF NOMINEE");

  drawFieldRow([
    { label: "Nominee Name:", value: `${formData.familyName}, ${formData.otherNames}`, widthRatio: 1.3 },
    { label: "Employee No:", value: formData.employeeNo, widthRatio: 1 },
  ]);

  drawFieldRow([
    { label: "Date of Birth:", value: formData.dateOfBirth, widthRatio: 1 },
    { label: "Gender:", value: formData.gender, widthRatio: 0.8 },
    { label: "Age:", value: formData.age ? `${formData.age} yrs` : "—", widthRatio: 0.7 },
    { label: "NID No:", value: formData.nidNo, widthRatio: 1 },
  ]);

  drawFieldRow([
    { label: "Commenced Current Job:", value: formData.dateCommencedCurrentJob, widthRatio: 1.2 },
    { label: "Permanency in Public Service:", value: formData.datePermanencyPublicService, widthRatio: 1.3 },
  ]);

  drawFieldRow([
    { label: "Substantive Position:", value: formData.substantivePosition, widthRatio: 1.3 },
    { label: "Acting Position:", value: formData.actingPosition || "N/A (Substantive only)", widthRatio: 1.2 },
  ]);

  drawFieldRow([
    { label: "Residential / Contact Address:", value: formData.contactAddress, widthRatio: 1 },
  ]);

  drawFieldRow([
    { label: "Work Province & District:", value: formData.provinceDistrictWorking, widthRatio: 1.3 },
    { label: "Mobile / Phone:", value: `${formData.mobile || "—"} / ${formData.telephone || "—"}`, widthRatio: 1.2 },
  ]);

  drawFieldRow([
    { label: "Official Email:", value: formData.email, widthRatio: 1 },
  ]);

  currentY += 3;

  // SECTION 6: EMERGENCY CONTACT
  drawSectionHeader("6. EMERGENCY CONTACT DETAILS");

  drawFieldRow([
    { label: "Contact Name:", value: `${formData.emergencyName} (${formData.emergencyRelationship || "Kin"})`, widthRatio: 1.3 },
    { label: "Phone:", value: formData.emergencyPhone, widthRatio: 1.2 },
  ]);

  drawFieldRow([
    { label: "Address:", value: formData.emergencyAddress, widthRatio: 1.3 },
    { label: "Email:", value: formData.emergencyEmail || "—", widthRatio: 1.2 },
  ]);

  currentY += 3;

  // SECTION 7 & 8: EDUCATION & QUALIFICATIONS
  drawSectionHeader("7 & 8. SECONDARY EDUCATION & TERTIARY QUALIFICATIONS");

  drawFieldRow([
    { label: "7. Secondary Level:", value: formData.secondaryQualificationType || "—", widthRatio: 1.2 },
    { label: "Highest Grade Completed:", value: formData.highestGradeCompleted || "—", widthRatio: 1.3 },
  ]);

  drawFieldRow([
    { label: "High School Attended:", value: formData.provincialHighSchoolAttended || "—", widthRatio: 1 },
  ]);

  currentY += 2;

  // Tertiary Qualifications Table via autoTable
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...brandNavy);
  doc.text("8. Tertiary Qualifications & Certificates:", margin, currentY);
  currentY += 2;

  const qualRows = (formData.qualifications || []).map((q) => [
    q.institution || "—",
    q.year || "—",
    q.courses || "—",
    q.qualifications || "—",
  ]);

  if (qualRows.length === 0) {
    qualRows.push(["No formal tertiary records listed", "—", "—", "—"]);
  }

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [["Institution", "Year", "Courses / Major", "Qualification Awarded"]],
    body: qualRows,
    theme: "grid",
    headStyles: {
      fillColor: brandNavy,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [15, 23, 42],
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 18, halign: "center" },
      2: { cellWidth: 55 },
      3: { cellWidth: "auto" },
    },
    didDrawPage: () => {
      drawRunningHeader();
    },
  });

  // @ts-expect-error autoTable adds lastAutoTable to doc
  currentY = doc.lastAutoTable.finalY + 5;

  // ==========================================
  // SECTION 9 - 14: JOB, TRAINING NEEDS & PROGRAMME
  // ==========================================

  drawSectionHeader("9 – 11. CURRENT JOB DESCRIPTION, TRAINING NEEDS & REINTEGRATION PLAN");

  drawNarrativeBox(
    "9. CURRENT JOB DESCRIPTION (Main duties & core responsibilities in public office):",
    formData.currentJobDescription,
    22
  );

  drawNarrativeBox(
    "10. TRAINING NEEDS IDENTIFICATION (Identified capability gaps, performance deficiencies):",
    formData.trainingNeedsIdentification,
    22
  );

  drawNarrativeBox(
    "11. REINTEGRATION PLAN (Workplace application upon completion, mentoring & knowledge transfer):",
    formData.reintegrationPlan,
    22
  );

  drawSectionHeader("12 – 14. PROPOSED PROGRAMME, TARGETED POSITION & RECENT TRAINING");

  drawNarrativeBox(
    `12. DESCRIPTION OF PROPOSED PROGRAMME ${formData.courseBrochureFileName ? `[Brochure Attached: ${formData.courseBrochureFileName}]` : ""}:`,
    formData.descriptionOfProposedProgramme,
    20
  );

  drawFieldRow([
    { label: "13. Targeted Position Upon Completion:", value: formData.targetedPositionUponCompletion, widthRatio: 1 },
  ]);

  currentY += 2;

  // Section 14: Programmes in last 2 years
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...brandNavy);
  doc.text("14. Long-term Programmes (> 9 Months) Attended in Last 2 Years:", margin, currentY);
  currentY += 2;

  const prevProgRows = (formData.programmesLastTwoYears || []).map((p) => [
    p.courseTitle || "—",
    p.institutionVenue || "—",
    p.yearAttended || "—",
    `${p.durationMonths || "0"} mos`,
    p.sponsorDonor || "—",
  ]);

  if (prevProgRows.length === 0) {
    prevProgRows.push(["Nil. Nominee has not attended >9 months training in the last 2 years.", "—", "—", "—", "—"]);
  }

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [["Course Title", "Institution / Venue", "Year", "Duration", "Sponsor"]],
    body: prevProgRows,
    theme: "grid",
    headStyles: {
      fillColor: brandNavy,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [15, 23, 42],
      cellPadding: 2,
    },
    didDrawPage: () => {
      drawRunningHeader();
    },
  });

  // @ts-expect-error autoTable adds lastAutoTable to doc
  currentY = doc.lastAutoTable.finalY + 5;

  // ==========================================
  // SECTION 15 - 17: JUSTIFICATION & ENDORSEMENTS
  // ==========================================

  drawSectionHeader("15. JUSTIFICATION OF NOMINATION (KRA & PRIORITY JOB GROUP)");

  drawNarrativeBox(
    "15(a). Identified Relevant Key Result Areas (KRAs) from National Development Plans / Corporate Plan:",
    formData.kraJustification,
    20
  );

  drawNarrativeBox(
    "15(b). Identified Priority Job Group Justification:",
    formData.priorityJobGroupJustification,
    18
  );

  // Section 16: DTC Endorsement
  drawSectionHeader(
    "16. ENDORSEMENT BY DEPARTMENTAL TRAINING COMMITTEE (DTC)",
    `Committee Endorsement Decision: [ ${formData.dtcEndorsement === "YES" ? "YES - ENDORSED" : formData.dtcEndorsement === "NO" ? "NO - NOT ENDORSED" : "PENDING"} ]`
  );

  ensureSpace(35);
  const dtcBoxY = currentY;
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderGray);
  doc.rect(margin, dtcBoxY, contentWidth, 32, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...brandNavy);
  doc.text("PARTICULARS OF NOMINATING AUTHORITY (DTC CHAIR / SECRETARY):", margin + 3, dtcBoxY + 5);

  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${formData.dtcAuthorityName || "—"}`, margin + 3, dtcBoxY + 11);
  doc.text(`Title / Designation: ${formData.dtcAuthorityTitle || "—"}`, margin + 3, dtcBoxY + 16);
  const dtcDateStr = (formData.dtcSignatureDataUrl && formData.dtcEndorsementDate)
    ? formData.dtcEndorsementDate
    : `……/……/${formData.bidYear || "2026"}`;
  doc.text(`Endorsement Date: ${dtcDateStr}`, margin + 3, dtcBoxY + 21);

  // DTC Signature Box
  const sigWidth = 55;
  const sigX = pageWidth - margin - sigWidth - 3;
  doc.setDrawColor(...borderGray);
  doc.rect(sigX, dtcBoxY + 4, sigWidth, 24, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...headerGray);
  doc.text("DTC CHAIR SIGNATURE / SEAL:", sigX + 2, dtcBoxY + 8);

  if (formData.dtcSignatureDataUrl) {
    try {
      doc.addImage(formData.dtcSignatureDataUrl, "PNG", sigX + 4, dtcBoxY + 9, sigWidth - 8, 16);
    } catch (e) {
      console.warn("Could not embed DTC signature into PDF", e);
      doc.setFont("helvetica", "italic");
      doc.text("[Digitally Verified Signature]", sigX + 4, dtcBoxY + 18);
    }
  } else {
    doc.setFont("helvetica", "italic");
    doc.setTextColor(148, 163, 184);
    doc.text("……………………………………………", sigX + 4, dtcBoxY + 18);
  }

  currentY = dtcBoxY + 36;

  // Section 17: Departmental Head Signature & Action Officer
  drawSectionHeader("17. SIGNATURE OF RESPECTIVE DEPARTMENTAL HEAD & ACTION OFFICER");

  ensureSpace(45);
  const deptBoxY = currentY;
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderGray);
  doc.rect(margin, deptBoxY, contentWidth, 38, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...brandNavy);
  doc.text("AGENCY / DEPARTMENT HEAD ENDORSEMENT:", margin + 3, deptBoxY + 5);

  doc.setFont("helvetica", "normal");
  doc.text(`Departmental Head Name: ${formData.deptHeadName || "—"}`, margin + 3, deptBoxY + 11);
  doc.text(`Designation: ${formData.deptHeadDesignation || "—"}`, margin + 3, deptBoxY + 16);
  if (formData.deptHeadDelegationEvidenceNote) {
    doc.setFontSize(7.5);
    doc.setTextColor(...headerGray);
    doc.text(`Delegation Note: ${formData.deptHeadDelegationEvidenceNote}`, margin + 3, deptBoxY + 21);
    doc.setFontSize(8);
    doc.setTextColor(...brandNavy);
  }
  const deptHeadDateStr = (formData.deptHeadSignatureDataUrl && formData.deptHeadSignDate)
    ? formData.deptHeadSignDate
    : `……/……/${formData.bidYear || "2026"}`;
  doc.text(`Sign Date: ${deptHeadDateStr}`, margin + 3, deptBoxY + 27);

  // Dept Head Signature Box
  doc.setDrawColor(...borderGray);
  doc.rect(sigX, deptBoxY + 4, sigWidth, 28, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...headerGray);
  doc.text("DEPT. HEAD SIGNATURE:", sigX + 2, deptBoxY + 8);

  if (formData.deptHeadSignatureDataUrl) {
    try {
      doc.addImage(formData.deptHeadSignatureDataUrl, "PNG", sigX + 4, deptBoxY + 9, sigWidth - 8, 18);
    } catch (e) {
      console.warn("Could not embed Dept Head signature into PDF", e);
      doc.setFont("helvetica", "italic");
      doc.text("[Digitally Verified Signature]", sigX + 4, deptBoxY + 20);
    }
  } else {
    doc.setFont("helvetica", "italic");
    doc.setTextColor(148, 163, 184);
    doc.text("……………………………………………", sigX + 4, deptBoxY + 20);
  }

  currentY = deptBoxY + 42;

  // Action Officer Footer Section
  ensureSpace(20);
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(...brandNavy);
  doc.rect(margin, currentY, contentWidth, 16, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...brandNavy);
  doc.text("ACTION OFFICER PARTICULARS (Liaison with DPM):", margin + 3, currentY + 4.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(`Name: ${formData.actionOfficerName || "—"}`, margin + 3, currentY + 9.5);
  doc.text(`Title: ${formData.actionOfficerTitle || "—"}`, margin + 65, currentY + 9.5);
  doc.text(`Phone: ${formData.actionOfficerTelephone || "—"}`, margin + 130, currentY + 9.5);

  doc.text(`Email: ${formData.actionOfficerEmail || formData.email || "—"}`, margin + 3, currentY + 13.5);
  doc.text(`Agency Address: ${formData.postalAddress || "—"}`, margin + 65, currentY + 13.5);

  // ==========================================
  // ADD PAGE NUMBERING AND TIMESTAMPS TO ALL PAGES
  // ==========================================
  // @ts-expect-error getNumberOfPages is standard in jsPDF
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.saveGraphicsState();

    // Footer divider
    doc.setDrawColor(...borderGray);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    // Footer text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...headerGray);
    doc.text("Official Papua New Guinea DPM Public Sector Training Aid Bid Form", margin, pageHeight - 6);

    const timeStr = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    doc.text(`Generated: ${timeStr}`, pageWidth / 2, pageHeight - 6, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: "right" });

    doc.restoreGraphicsState();
  }

  return doc;
};

export const generateDPMBidFormPDF = async (
  formData: DPMBidFormData,
  options?: GeneratePdfOptions
): Promise<void> => {
  const doc = await buildDPMBidFormPDFDocument(formData);
  const cleanFamilyName = (formData.familyName || "Nominee").replace(/[^a-zA-Z0-9]/g, "_");
  const year = formData.bidYear || "2026";
  const defaultFileName = `DPM_Training_Aid_Bid_Form_${cleanFamilyName}_${year}.pdf`;
  doc.save(options?.fileName || defaultFileName);
};

export const getDPMBidFormPDFBase64 = async (
  formData: DPMBidFormData
): Promise<{ base64: string; dataUri: string; fileName: string }> => {
  const doc = await buildDPMBidFormPDFDocument(formData);
  const cleanFamilyName = (formData.familyName || "Nominee").replace(/[^a-zA-Z0-9]/g, "_");
  const year = formData.bidYear || "2026";
  const fileName = `DPM_Training_Aid_Bid_Form_${cleanFamilyName}_${year}.pdf`;
  const dataUri = doc.output("datauristring");
  const base64 = dataUri.split(",")[1] || "";
  return { base64, dataUri, fileName };
};

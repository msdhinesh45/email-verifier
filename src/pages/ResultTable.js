import React, { useState } from "react";
import ExcelJS from "exceljs";
import "../assets/styles/components/ResultTable.css";

export default function ResultTable({ data, onBack }) {
  const [filter, setFilter] = useState("all");

  // Count emails for duplicate detection
  const emailCount = data.reduce((acc, row) => {
    acc[row.email] = (acc[row.email] || 0) + 1;
    return acc;
  }, {});

  // Filter data based on dropdown
  const filteredData = data.filter((row) => {
    const statusValue = 
      typeof row.status === "string" 
        ? row.status.toLowerCase() === "true"
        : !!row.status;

    if (filter === "true") return statusValue === true && row.stored !== false;
    if (filter === "false") return statusValue === false || row.stored === false;
    if (filter === "duplicate") return emailCount[row.email] > 1;
    return true;
  });

  // Download Excel function with professional styling
  const handleDownload = async () => {
    if (!filteredData.length) {
      alert("No data available to download");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Email Verification Results");

    // Add title row
    const titleRow = sheet.addRow(["Email Verification Results"]);
    titleRow.font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
    titleRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2C5AA0" }
    };
    titleRow.alignment = { horizontal: "center", vertical: "middle" };
    sheet.mergeCells('A1:G1');

    // Add timestamp
    const timeRow = sheet.addRow([`Generated on: ${new Date().toLocaleString()}`]);
    timeRow.font = { italic: true, size: 10, color: { argb: "FF666666" } };
    sheet.mergeCells('A2:G2');

    sheet.addRow([]); // Empty row

    // Header row
    const headers = ["Email", "Syntax", "DNS", "SMTP", "Status", "Validity", "Remarks"];
    const headerRow = sheet.addRow(headers);
    
    // Style header row
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1E3A8A" }
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FF2C5AA0" } },
        left: { style: "thin", color: { argb: "FF2C5AA0" } },
        bottom: { style: "thin", color: { argb: "FF2C5AA0" } },
        right: { style: "thin", color: { argb: "FF2C5AA0" } }
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    // Add data rows
    filteredData.forEach((row) => {
      let remarks = "";
      if (!row.syntax || row.syntax === "Invalid") remarks += "Invalid Syntax; ";
      if (!row.dns || row.dns === "Fail") remarks += "DNS not found; ";
      if (!row.smtp || row.smtp === "Fail") remarks += "SMTP failed; ";
      if (row.status === false) remarks += "Status invalid; ";
      if (row.validity === false) remarks += "Overall invalid; ";
      remarks = remarks.trim().replace(/;$/, "");
      if (!remarks) remarks = "Valid Email";

      if (emailCount[row.email] > 1) {
        remarks += " (Duplicate)";
      }

      const newRow = sheet.addRow([
        row.email,
        row.syntax || "False",
        row.dns || "False",
        row.smtp || "False",
        row.status ? "True" : "False",
        row.validity ? "True" : "False",
        remarks,
      ]);

      // Determine row color
      let fillColor = "FFFFFFFF"; // white default
      if (emailCount[row.email] > 1) {
        fillColor = "FFFFF7ED"; // light orange for duplicates
      } else if (row.status) {
        fillColor = "FFF0F9FF"; // light blue for valid
      } else {
        fillColor = "FFFEF2F2"; // light red for invalid
      }

      newRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: fillColor }
        };
        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } }
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        
        // Color text based on status
        if (cell.value === "True" || cell.value === "Valid" || cell.value === "Pass") {
          cell.font = { color: { argb: "FF059669" }, bold: true };
        } else if (cell.value === "False" || cell.value === "Invalid" || cell.value === "Fail") {
          cell.font = { color: { argb: "FFDC2626" }, bold: true };
        }
      });
    });

    // Auto-width columns
    sheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = Math.min(30, Math.max(12, maxLength + 2));
    });

    // Generate and download
    try {
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `email_verification_results_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Excel export failed", err);
      alert("Failed to create Excel file");
    }
  };

  // Compute human-friendly remarks for a row to show in UI
  const computeRemarks = (row) => {
    const remarks = [];

    // Syntax
    const syntaxInvalid = row.syntax === false || (typeof row.syntax === 'string' && row.syntax.toLowerCase && row.syntax.toLowerCase() === 'invalid') || !row.syntax;
    if (syntaxInvalid) remarks.push('Invalid syntax');

    // DNS
    const dnsFail = row.dns === 'Fail' || row.dns === 'false' || row.dns === false || !row.dns;
    if (dnsFail) remarks.push('DNS lookup failed');

    // SMTP
    const smtpFail = row.smtp === 'Fail' || row.smtp === 'false' || row.smtp === false || !row.smtp;
    if (smtpFail) remarks.push('SMTP check failed');

    // Status / validity
    if (row.status === false || row.status === 'false') remarks.push('Verification status invalid');
    if (row.validity === false || row.validity === 'false') remarks.push('Overall validity failed');

    // Duplicate / not stored
    if (row.stored === false) remarks.push('Duplicate (not stored)');
    else if (emailCount[row.email] > 1) remarks.push('Duplicate occurrence');

    return remarks.length ? remarks.join('; ') : 'Valid email';
  };

  // Stats calculation
  const validCount = data.filter(row => row.status && row.stored !== false).length;
  const invalidCount = data.filter(row => !row.status || row.stored === false).length;
  const duplicateCount = Object.values(emailCount).filter(count => count > 1).length;

  console.log("Rendering ResultTable with data:", data.filter(row => row.status));
  return (
    <div className="result-table">
      <h2>Email Verification Results</h2>

      {/* Stats Summary */}
      <div className="stats-summary">
        <div className="valid">
          <div className="stat-number">{validCount}</div>
          <div className="stat-label">Valid Emails</div>
        </div>
        <div className="invalid">
          <div className="stat-number">{invalidCount}</div>
          <div className="stat-label">Invalid Emails</div>
        </div>
        <div className="duplicate">
          <div className="stat-number">{duplicateCount}</div>
          <div className="stat-label">Duplicate Emails</div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="filter-controls">
        <label>Filter by Status:</label>
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Results ({data.length})</option>
          <option value="true">Valid Only ({validCount})</option>
          <option value="false">Invalid Only ({invalidCount})</option>
          <option value="duplicate">Duplicates Only ({duplicateCount})</option>
        </select>
      </div>

      {/* Table with Scroll */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Email Address</th>
              <th>Syntax</th>
              <th>DNS</th>
              <th>SMTP</th>
              <th>Status</th>
              <th>Validity</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((row, index) => (
                <tr 
                  key={index} 
                  className={emailCount[row.email] > 1 ? "duplicate-row" : ""}
                >
                  <td>
                    <div className="email-cell">
                      <div className="email-address">{row.email}</div>
                      {row.stored === false && (
                        <span className="duplicate-badge">Not Stored</span>
                      )}
                      {emailCount[row.email] > 1 && (
                        <div className="duplicate-occurrence">Duplicate occurrence</div>
                      )}
                    </div>
                  </td>
                  <td className={row.syntax ? "status-valid" : "status-invalid"}>
                    <span style={{ color: row.syntax ? '#059669' : '#dc2626', fontWeight: 'bold' }}>
                      {row.syntax ? "Valid" : "Invalid"}
                    </span>
                  </td>
                  <td className={row.dns === true || row.dns === "true" || row.dns === "Pass" ? "status-valid" : "status-invalid"}>
                    <span style={{ color: (row.dns === true || row.dns === "true" || row.dns === "Pass") ? '#059669' : '#dc2626', fontWeight: 'bold' }}>
                      {(row.dns === true || row.dns === "true" || row.dns === "Pass") ? "True" : "False"}
                    </span>
                  </td>
                  <td className={row.smtp === "Pass" ? "status-valid" : "status-invalid"}>
                    <span style={{ color: row.smtp === "Pass" ? '#059669' : '#dc2626', fontWeight: 'bold' }}>
                      {row.smtp === "Pass" ? "True" : "False"}
                    </span>
                  </td>
                  <td className={row.status ? "status-valid" : "status-invalid"}>
                    <span style={{ color: row.status ? '#059669' : '#dc2626', fontWeight: 'bold' }}>
                      {row.status ? "True" : "False"}
                    </span>
                  </td>
                  <td className={row.stored === false ? "status-invalid" : (row.validity ? "status-valid" : "status-invalid")}>
                    <span style={{ color: row.stored === false ? '#dc2626' : (row.validity ? '#059669' : '#dc2626'), fontWeight: 'bold' }}>
                      {row.stored === false ? "Invalid" : (row.validity ? "Valid" : "Invalid")}
                    </span>
                  </td>
                  <td className="remarks-cell">{computeRemarks(row)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">
                  <div className="empty-state">
                    No results found for the selected filter
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Action Buttons */}
      <div className="result-actions">
        <button className="back-btn" onClick={onBack}>
          ⬅ Back to Dashboard
        </button>
        <button className="download-btn" onClick={handleDownload}>
          ⬇ Download Excel Report
        </button>
      </div>
    </div>
  );
}
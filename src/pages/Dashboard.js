import React, { useState } from "react";
import "../assets/styles/components/Dashboard.css";
import * as XLSX from "xlsx";
import ResultTable from "./ResultTable";
import { emailPost, emailGetAll,emaildeleteAll } from "../api";
import { ToastContainer, toast } from "react-toastify";
// import { ThemeContext } from "../App";
import "react-toastify/dist/ReactToastify.css";

export default function FileUpload() {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [resultData, setResultData] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [manualEmail, setManualEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentProcessingStage, setCurrentProcessingStage] = useState("");
  // const { theme } = useContext(ThemeContext);

  const showSuccess = (msg) => toast.success(msg, { position: "top-right" });
  const showError = (msg) => toast.error(msg, { position: "top-right" });

  // ✅ Domain-based SMTP check
  const checkSMTP = (email) => {
    const domain = email.split("@")[1]?.toLowerCase() || "";

    const smtpSupportedDomains = [
      "gmail.com",
      "yahoo.com",
      "outlook.com",
      "hotmail.com",
      "icloud.com",
      "protonmail.com",
      "example.com",
    ];

    if (smtpSupportedDomains.includes(domain)) {
      return "Pass";
    } else {
      return "Fail";
    }
  };

  // Handle file select
  const handleFileSelect = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile && validateFile(uploadedFile)) {
      setFile(uploadedFile);
      simulateUpload();
      showSuccess("File uploaded successfully!");
    } else {
      showError("Only CSV or Excel files are allowed!");
    }
  };

  // Handle drag & drop
  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);

    const uploadedFile = event.dataTransfer.files[0];
    if (uploadedFile && validateFile(uploadedFile)) {
      setFile(uploadedFile);
      simulateUpload();
      showSuccess("File uploaded successfully!");
    } else {
      showError("Only CSV or Excel files are allowed!");
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  // Validate file type
  const validateFile = (file) => {
    const allowedTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    return allowedTypes.includes(file.type);
  };

  // ✅ Manual email verify
 const handleManualVerify = async () => {
  if (!manualEmail.trim()) {
    showError("Please enter an email!");
    return;
  }

  const emailRegex = /^(?=.{3,254}$)(?=.{1,64}@)(?=[A-Za-z0-9]*[A-Za-z])[A-Za-z0-9]+@[A-Za-z0-9-]+\.[A-Za-z]{2,}$/;
  if (!emailRegex.test(manualEmail)) {
    showError("Invalid email format!");
    return;
  }

  setIsProcessing(true);
  setProcessingProgress(0);
  setCurrentProcessingStage("Verifying email...");

  const steps = [
    "Checking syntax...",
    "Validating domain...",
    "Checking SMTP...",
    "Finalizing..."
  ];

  for (let i = 0; i < steps.length; i++) {
    setCurrentProcessingStage(steps[i]);
    setProcessingProgress(((i + 1) / steps.length) * 100);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  try {
    // First check if this email already exists in DB
    // const allEmails = await emailGetAll();
    // const existsInDb = (allEmails?.data || []).some(item => item.email === manualEmail);

    // // Create a local processed object for display (syntax/smtp/dns/status/validity)
    // const isValid = validateEmailSyntax(manualEmail);
    // const smtp = checkSMTP(manualEmail);
    // const localRow = {
    //   email: manualEmail,
    //   syntax: isValid ? "Valid" : "Invalid",
    //   dns: smtp === "Pass" ? "Pass" : "Fail",
    //   smtp,
    //   status: isValid,
    //   validity: isValid ? "Valid" : "Invalid",
    //   // stored === false means we didn't store this occurrence in backend (duplicate)
    //   stored: !existsInDb ? true : false
    // };

    // if (existsInDb) {
    //   // Email already exists -> show duplicate (not stored)
    //   // setResultData([localRow]);
    //   setShowResult(true);
    //   showError("Email already exists — marked as duplicate (not stored).");
    // } else {
      // Not in DB -> post and then fetch saved record
      const postResponse = await emailPost({ emails: [manualEmail] });
      console.log("Post Response:", postResponse);

      if (postResponse?.success) {
        showSuccess("Email verified and stored successfully!");
      }

      // Fetch saved record
      const freshAll = await emailGetAll();
      const newEmail = (freshAll?.data || []).find(item => item.email === manualEmail);
      // console.log(newEmail)
      if (newEmail) {
        // mark stored true for clarity in UI
        newEmail.stored = true;
        setResultData([newEmail]);
        setShowResult(true);
      } else {
        showError("Unable to fetch posted email!");
      }
    // }
  } catch (error) {
    console.error("API Error:", error);
    showError("Something went wrong while verifying email!");
  }

  setIsProcessing(false);
};


  // ✅ Excel/CSV Submit
 const HandelSubmit = async () => {
  if (!file) {
    showError("Please select a file first!");
    return;
  }

  setIsProcessing(true);
  setProcessingProgress(0);
  setCurrentProcessingStage("Starting file processing...");

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      setCurrentProcessingStage("Reading file...");
      setProcessingProgress(10);

      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      const emailKeys = Object.keys(jsonData[0] || {});
      const emailKey = emailKeys.find(
        (key) =>
          key.toLowerCase().includes("email") ||
          key.toLowerCase().includes("mail")
      );

      if (!emailKey) {
        showError("No email column found!");
        setIsProcessing(false);
        return;
      }

      const emailArray = jsonData
        .map((item) => item[emailKey])
        .filter((email) => email && email.trim() !== "");

      setCurrentProcessingStage("Processing emails...");
      setProcessingProgress(50);

      const processed = emailArray.map((email) => {
        const isValid = validateEmailSyntax(email);
        const smtp = checkSMTP(email);
        return {
          email,
          syntax: isValid ? "Valid" : "Invalid",
          dns: smtp === "Pass" ? "Pass" : "Fail",
          smtp,
          status: isValid,
          validity: isValid ? "Valid" : "Invalid"
        };
      });

      setCurrentProcessingStage("Saving to database...");
      setProcessingProgress(80);

      // Avoid storing duplicate occurrences in backend. Send only unique emails.
      const counts = emailArray.reduce((acc, e) => {
        acc[e] = (acc[e] || 0) + 1;
        return acc;
      }, {});
      const uniqueEmails = Array.from(new Set(emailArray));

      // Post only the unique emails
      try {
        const postResponse = await emailPost({ emails: uniqueEmails });
        console.log("Post Response:", postResponse);
      } catch (error) {
        console.error("Email post error:", error);
      }

      setCurrentProcessingStage("Fetching saved data...");
      setProcessingProgress(90);

      // Fetch all emails
      const allEmails = await emailGetAll();
      console.log("All Emails from DB:", allEmails.data);

      // Get DB records for the unique emails uploaded
      const justUploadedEmails = (allEmails.data || []).filter((item) =>
        uniqueEmails.includes(item.email)
      );

      // Build final results: include stored DB items and synthetic 'not stored' duplicates
      const finalResults = [];

      // Map for quick lookup of processed metadata (from earlier processed array)
      const processedMap = processed.reduce((acc, row) => {
        acc[row.email] = row;
        return acc;
      }, {});

      uniqueEmails.forEach((email) => {
        const dbItem = justUploadedEmails.find((i) => i.email === email);
        if (dbItem) {
          // mark as stored in UI
          dbItem.stored = true;
          finalResults.push(dbItem);
        } else {
          // fallback: use local processed data
          const p = processedMap[email];
          if (p) {
            finalResults.push({ ...p, stored: true });
          }
        }

        // If duplicates existed in the uploaded file, append synthetic entries for the extra occurrences
        const extraCount = counts[email] - 1;
        for (let i = 0; i < extraCount; i++) {
          const p = processedMap[email];
          if (p) {
            // mark stored false to indicate not saved to backend (duplicate)
            finalResults.push({ ...p, stored: false });
          } else {
            finalResults.push({
              email,
              syntax: "Unknown",
              dns: "Unknown",
              smtp: "Unknown",
              status: false,
              validity: false,
              stored: false
            });
          }
        }
      });

      setCurrentProcessingStage("Finalizing...");
      setProcessingProgress(100);

      setTimeout(() => {
        setResultData(finalResults);
        setShowResult(true);
        setIsProcessing(false);
      }, 500);

    } catch (error) {
      showError("Error reading file!");
      console.error(error);
      setIsProcessing(false);
    }
  };

  reader.readAsArrayBuffer(file);
};


  // Basic regex syntax check
  const validateEmailSyntax = (email) => {
    // const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const regex=/^(?=.{3,254}$)(?=.{1,64}@)(?=[A-Za-z0-9]*[A-Za-z])[A-Za-z0-9]+@[A-Za-z0-9-]+\.[A-Za-z]{2,}$/
    return regex.test(email);
  };

  // Simulate upload progress
  const simulateUpload = () => {
    setUploadProgress(0);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) clearInterval(interval);
    }, 300);
  };

  // Show results table
  if (showResult) {
    return <ResultTable data={resultData} onBack={() =>{
      setShowResult(false)
      setResultData([])
    }} />;
  }

  return (
    <>
      {/* Loading Overlay */}
      {isProcessing && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
          color: "white"
        }}>
          {/* Pacman Animation */}
          <div style={{
            position: "relative",
            width: "100px",
            height: "100px",
            marginBottom: "30px"
          }}>
            {/* Pacman */}
            <div style={{
              width: "50px",
              height: "50px",
              backgroundColor: "#FFD700",
              borderRadius: "50%",
              position: "absolute",
              top: "25px",
              left: "25px",
              animation: "eat 0.6s infinite alternate",
              transformOrigin: "center"
            }}></div>
            
            {/* Food Dots */}
            <div style={{
              position: "absolute",
              top: "45px",
              left: "90px",
              width: "10px",
              height: "10px",
              backgroundColor: "#FFD700",
              borderRadius: "50%",
              animation: "moveFood 1.5s infinite linear"
            }}></div>
            <div style={{
              position: "absolute",
              top: "45px",
              left: "110px",
              width: "10px",
              height: "10px",
              backgroundColor: "#FFD700",
              borderRadius: "50%",
              animation: "moveFood 1.5s infinite linear 0.3s"
            }}></div>
            <div style={{
              position: "absolute",
              top: "45px",
              left: "130px",
              width: "10px",
              height: "10px",
              backgroundColor: "#FFD700",
              borderRadius: "50%",
              animation: "moveFood 1.5s infinite linear 0.6s"
            }}></div>
          </div>

          {/* Processing Text */}
          <h3 style={{ 
            marginBottom: "20px", 
            color: "#FFD700",
            fontSize: "1.5rem"
          }}>
            Processing Your Data...
          </h3>

          {/* Progress Stage */}
          <p style={{ 
            marginBottom: "15px",
            fontSize: "1.1rem",
            textAlign: "center"
          }}>
            {currentProcessingStage}
          </p>

          {/* Progress Bar */}
          <div style={{
            width: "300px",
            height: "20px",
            backgroundColor: "#333",
            borderRadius: "10px",
            marginBottom: "10px",
            overflow: "hidden"
          }}>
            <div style={{
              width: `${processingProgress}%`,
              height: "100%",
              background: "linear-gradient(90deg, #FFD700, #FFA500)",
              borderRadius: "10px",
              transition: "width 0.3s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              paddingRight: "10px",
              color: "black",
              fontWeight: "bold",
              fontSize: "12px"
            }}>
              {processingProgress >= 50 && `${Math.round(processingProgress)}%`}
            </div>
          </div>

          {/* Progress Percentage */}
          <p style={{ 
            fontSize: "1rem",
            color: "#FFD700",
            fontWeight: "bold"
          }}>
            {Math.round(processingProgress)}% Complete
          </p>

          {/* Cancel Button */}
          <button 
            onClick={() => setIsProcessing(false)}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              backgroundColor: "transparent",
              border: "2px solid #FFD700",
              color: "#FFD700",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold",
              transition: "all 0.3s ease"
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#FFD700";
              e.target.style.color = "black";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "transparent";
              e.target.style.color = "#FFD700";
            }}
          >
            Cancel Processing
          </button>
        </div>
      )}


{/* 💥 IMPLEMENTING SPLIT-CARD LAYOUT */}
<div className="dashboard-card">
  
  {/* LEFT PANEL: Manual Verification */}
  <div className="dashboard-left-panel">
    <h2 style={{
        fontSize: "2rem",
        marginBottom: "0px",
        color: "var(--text-color-light)",
        textAlign: "center"
    }}>
      Email Verification
    </h2>

    {/* Manual Input Section */}
    <div className="manual-input" style={{marginBlock:"26px"}}>
      <input
        type="email"
        placeholder="Enter email to verify (e.g., info@example.com)"
        value={manualEmail}
        onChange={(e) => setManualEmail(e.target.value)}
        disabled={isProcessing}
      />
      <button 
        className="manual-verify-btn" 
        onClick={handleManualVerify}
        disabled={isProcessing}
        style={{ opacity: isProcessing ? 0.6 : 1 }}
      >
        Verify Single Email
      </button>
    </div>
  </div>

  {/* RIGHT PANEL: File Upload */}
  <div className="dashboard-right-panel">
    <h2 style={{
        fontSize: "1.8rem",
        marginBottom: "20px",
        color: "var(--text-color-light)"
    }}>
      Upload File
    </h2>

    {/* File Upload Section */}
    <div
      className={`file-upload-wrapper ${dragOver ? "drag-over" : ""}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      style={{ opacity: isProcessing ? 0.6 : 1 }}
    >
      <div className="file-upload-icon">📂</div>
<div className="file-upload-content" style={{height:"100px"}}>
      {file ? (
        <>
          <p>
            <strong>File Name:</strong> {file.name}
          </p>
          <p>
            <strong>Size:</strong> {(file.size / 1024).toFixed(2)} KB
          </p>
          <p className="upload-status">
            {uploadProgress < 100
              ? `Uploading... ${uploadProgress}%`
              : "✅ Upload Complete!"}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',marginTop:'10px',gap:'10px' }}>
          
            <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setUploadProgress(0);
                  window.location.reload(); // Reload the window
                }}
                style={{
                  padding: '2px 8px',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>✕</span> Cancel
              </button>
          </div>
        </>
      ) : (
        <>
        <p>
            <strong>File Name</strong> 
          </p>
          <p>
            <strong>Size</strong> 
          </p>
          <p className="upload-status">
           
          </p>
          </>
      )}
</div>
      <p>Drag & Drop your CSV/Excel file here</p>
      <label className="choose-file-button" style={{ opacity: isProcessing ? 0.6 : 1 }}>
        Choose File
        <input
          type="file"
          accept=".csv,.xls,.xlsx"
          onChange={handleFileSelect}
          disabled={isProcessing}
        /> 
      </label>
     
      {/* <span className="file-upload-text">or Drag & Drop (.csv/.xlsx)</span> */}
    </div>

    {/* Submit Button */}
    <button 
      onClick={HandelSubmit} 
      className="submit-btn"
      disabled={isProcessing}
      style={{ opacity: isProcessing ? 0.6 : 1 }}
    >
      {isProcessing ? "PROCESSING..." : "SUBMIT FILE FOR VERIFICATION"}
    </button>
    
  </div>
</div>
{/* 💥 END SPLIT-CARD LAYOUT */}
      <ToastContainer autoClose={2500} theme="colored" />

      {/* Add CSS animations */}
      <style>
        {`
          @keyframes eat {
            0% { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
            50% { clip-path: polygon(0 0, 100% 50%, 100% 50%, 0 100%); }
            100% { clip-path: polygon(0 50%, 100% 50%, 100% 50%, 0 50%); }
          }

          @keyframes moveFood {
            0% { transform: translateX(0); opacity: 1; }
            100% { transform: translateX(-80px); opacity: 0; }
          }
        `}
      </style>
    </>
  );
}
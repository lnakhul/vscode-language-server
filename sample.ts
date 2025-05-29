import React from 'react';
import './ReviewHeader.css'; // Or use styled-components

const ReviewHeader = () => {
  return (
    <div className="review-header">
      {/* Top Metadata */}
      <div className="meta-row">
        <div><strong>Review ID:</strong> #12345678</div>
        <div><strong>State:</strong> OPEN</div>
        <div><strong>Created:</strong> TIME</div>
      </div>

      {/* Title */}
      <h2 className="review-title">Review XYZ</h2>

      {/* Repo / Branch / Author Info */}
      <div className="info-row">
        <div><strong>Repository:</strong> <span>repo-name</span></div>
        <div><strong>Branch:</strong> <span>feature/mybranch</span></div>
        <div><strong>Last Modified:</strong> <span className="badge">SUPERVISED</span></div>
      </div>
      <div className="info-row">
        <div><strong>Author:</strong> <span>username</span></div>
        <div><strong>Reviewer(s):</strong> <span>reviewer1, reviewer2</span></div>
      </div>

      {/* Summary Section */}
      <div className="summary-section">
        <strong>Summary / Description:</strong>
        <div className="summary-box">
          Fixes XYZ, refactored ABC.
        </div>
      </div>

      {/* Action Buttons */}
      <div className="actions-row">
        <button className="btn approve">✔ Approve</button>
        <button className="btn reject">✖ Reject</button>
        <button className="btn comment">💬 Comment</button>
        <span className="last-action">Last Action: <strong>xyz by user123</strong></span>
      </div>
    </div>
  );
};

export default ReviewHeader;


.review-header {
  background-color: #1e1e2f;
  color: #e0e0e0;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-family: sans-serif;
}

.meta-row, .info-row, .actions-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.review-title {
  margin: 10px 0;
}

.summary-section {
  margin-top: 1rem;
}

.summary-box {
  background-color: #2a2a3c;
  padding: 10px;
  border-radius: 5px;
  margin-top: 5px;
}

.badge {
  background-color: #444;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8rem;
  color: #fff;
}

.btn {
  background-color: #333;
  border: none;
  padding: 8px 14px;
  border-radius: 4px;
  color: white;
  cursor: pointer;
}

.btn:hover {
  opacity: 0.85;
}

.last-action {
  margin-left: auto;
  font-size: 0.9rem;
  opacity: 0.7;
}

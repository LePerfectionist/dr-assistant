import React, { useState, useEffect } from 'react';
import apiClient from './apiClient'; // Import our authenticated API client
import './AnalysisPage.css'; 
import GraphChat from './GraphChat';

function AnalysisPage({ applicationId, setView }) {
  const [graphHtml, setGraphHtml] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!applicationId) {
      setError('No application selected.');
      setIsLoading(false);
      return;
    }

    const fetchGraph = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient.get(
          `/api/v1/analysis/${applicationId}/dependency_graph`
        );
        setGraphHtml(response.data); // The response.data is the raw HTML string
      } catch (err) {
        setError('Failed to load dependency graph. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGraph();
  }, [applicationId]); // Re-run this effect if the applicationId changes

  return (
    <div className="analysis-container">
      <div className="analysis-header">
        <h2>Dependency Graph for Application #{applicationId}</h2>
        <button onClick={() => setView('myapps')}>← Back to My Applications</button>
      </div>
      
      <div className="graph-wrapper">
        {isLoading && <p className="loading-message">Generating graph...</p>}
        {error && <p className="error-message">{error}</p>}
        {!isLoading && !error && (
          // We use an iframe to render the graph. This is the safest way to
          // display external/complex HTML content, as it isolates the graph's
          // styles and scripts from the rest of your React app.
          <iframe
            srcDoc={graphHtml}
            title={`Dependency Graph for Application ${applicationId}`}
            style={{ width: '100%', height: '800px', border: 'none' }}
          />
        )}
      </div>
    </div>
  );
}

export default AnalysisPage;
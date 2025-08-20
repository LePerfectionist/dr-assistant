import React, { useState } from 'react';
import './SystemEditModal.css';

const SystemEditModal = ({ system, user, onClose, onSubmitChanges }) => {
  const [formData, setFormData] = useState({
    name: system.name || '',
    dr_data: system.dr_data || '',
    upstream_dependencies: system.upstream_dependencies?.join(', ') || '',
    downstream_dependencies: system.downstream_dependencies?.join(', ') || '',
    key_contacts: system.key_contacts?.join(', ') || '',
    system_type: system.system_type || 'internal',
    source_reference: system.source_reference || ''
  });
  
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [changedFields, setChangedFields] = useState(new Set());

  const handleFieldChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));

    // Track which fields have been changed
    const originalValue = getOriginalValue(fieldName);
    const newChangedFields = new Set(changedFields);
    
    if (value !== originalValue) {
      newChangedFields.add(fieldName);
    } else {
      newChangedFields.delete(fieldName);
    }
    
    setChangedFields(newChangedFields);
  };

  const getOriginalValue = (fieldName) => {
    switch (fieldName) {
      case 'name':
        return system.name || '';
      case 'dr_data':
        return system.dr_data || '';
      case 'upstream_dependencies':
        return system.upstream_dependencies?.join(', ') || '';
      case 'downstream_dependencies':
        return system.downstream_dependencies?.join(', ') || '';
      case 'key_contacts':
        return system.key_contacts?.join(', ') || '';
      case 'system_type':
        return system.system_type || 'internal';
      case 'source_reference':
        return system.source_reference || '';
      default:
        return '';
    }
  };

  const prepareChanges = () => {
    const changes = {};
    
    changedFields.forEach(fieldName => {
      let value = formData[fieldName];
      
      // Convert comma-separated strings back to arrays for list fields
      if (['upstream_dependencies', 'downstream_dependencies', 'key_contacts'].includes(fieldName)) {
        value = value.split(',').map(item => item.trim()).filter(item => item.length > 0);
      }
      
      changes[fieldName] = value;
    });
    
    return changes;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (changedFields.size === 0) {
      setError('No changes detected. Please modify at least one field.');
      return;
    }
    
    if (!reason.trim()) {
      setError('Please provide a reason for these changes.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const changes = prepareChanges();
      
      const response = await fetch('http://localhost:8000/api/v1/change-proposals/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          system_id: system.id,
          reason: reason,
          changes: changes
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit changes');
      }

      const result = await response.json();
      onSubmitChanges(result);
      onClose();
      
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const isFieldChanged = (fieldName) => changedFields.has(fieldName);

  return (
    <div className="system-edit-modal-overlay">
      <div className="system-edit-modal">
        <div className="modal-header">
          <h2>Propose Changes for {system.name}</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-content">
          {error && <div className="error-message">{error}</div>}
          
          <div className="changes-info">
            <p><strong>Changed Fields:</strong> {changedFields.size > 0 ? Array.from(changedFields).join(', ') : 'None'}</p>
          </div>

          <div className="edit-form">
            <div className="form-group">
              <label>System Name:</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                className={isFieldChanged('name') ? 'changed-field' : ''}
              />
            </div>

            <div className="form-group">
              <label>System Type:</label>
              <select
                value={formData.system_type}
                onChange={(e) => handleFieldChange('system_type', e.target.value)}
                className={isFieldChanged('system_type') ? 'changed-field' : ''}
              >
                <option value="internal">Internal</option>
                <option value="external">External</option>
                <option value="unclassified">Unclassified</option>
              </select>
            </div>

            <div className="form-group">
              <label>DR Data:</label>
              <textarea
                value={formData.dr_data}
                onChange={(e) => handleFieldChange('dr_data', e.target.value)}
                rows={4}
                className={isFieldChanged('dr_data') ? 'changed-field' : ''}
              />
            </div>

            <div className="form-group">
              <label>Upstream Dependencies (comma-separated):</label>
              <input
                type="text"
                value={formData.upstream_dependencies}
                onChange={(e) => handleFieldChange('upstream_dependencies', e.target.value)}
                placeholder="Service A, Service B, Service C"
                className={isFieldChanged('upstream_dependencies') ? 'changed-field' : ''}
              />
            </div>

            <div className="form-group">
              <label>Downstream Dependencies (comma-separated):</label>
              <input
                type="text"
                value={formData.downstream_dependencies}
                onChange={(e) => handleFieldChange('downstream_dependencies', e.target.value)}
                placeholder="Service X, Service Y, Service Z"
                className={isFieldChanged('downstream_dependencies') ? 'changed-field' : ''}
              />
            </div>

            <div className="form-group">
              <label>Key Contacts (comma-separated emails):</label>
              <input
                type="text"
                value={formData.key_contacts}
                onChange={(e) => handleFieldChange('key_contacts', e.target.value)}
                placeholder="user1@example.com, user2@example.com"
                className={isFieldChanged('key_contacts') ? 'changed-field' : ''}
              />
            </div>

            <div className="form-group">
              <label>Source Reference:</label>
              <input
                type="text"
                value={formData.source_reference}
                onChange={(e) => handleFieldChange('source_reference', e.target.value)}
                className={isFieldChanged('source_reference') ? 'changed-field' : ''}
              />
            </div>

            <div className="form-group">
              <label>Reason for Changes:</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Please explain why these changes are needed..."
              />
            </div>

            <div className="modal-actions">
              <button type="button" onClick={onClose} className="cancel-button">
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleSubmit}
                className="submit-button" 
                disabled={loading || changedFields.size === 0}
              >
                {loading ? 'Submitting...' : `Submit Changes (${changedFields.size} field${changedFields.size !== 1 ? 's' : ''})`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemEditModal;
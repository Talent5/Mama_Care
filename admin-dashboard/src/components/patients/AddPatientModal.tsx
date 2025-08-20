import React, { useState } from 'react';
import { X, UserPlus, Save, Loader } from 'lucide-react';
import { patientsAPI } from '../../services/api';
import type { Patient } from '../../types/api';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientAdded?: (patient: Patient) => void;
}

const AddPatientModal: React.FC<AddPatientModalProps> = ({
  isOpen,
  onClose,
  onPatientAdded
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    facility: '',
    region: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    medicalHistory: '',
    allergies: '',
    isPregnant: false,
    gestationalAge: '',
    estimatedDueDate: '',
    riskLevel: 'low'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Basic validation
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      if (!formData.dateOfBirth || !formData.gender) {
        setError('Please provide date of birth and gender');
        setLoading(false);
        return;
      }

      if (!formData.address || !formData.facility || !formData.region) {
        setError('Please provide address, facility, and region');
        setLoading(false);
        return;
      }

      if (!formData.emergencyContactName || !formData.emergencyContactPhone || !formData.emergencyContactRelationship) {
        setError('Emergency contact name, phone and relationship are required');
        setLoading(false);
        return;
      }

      const patientData: any = {
        // Include basic user identity so backend can create a linked user when userId is not provided
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        // Phone exists on both user and patient; backend will set user phone and store patient phone as well
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender, // backend will normalize casing
        address: formData.address,
        facility: formData.facility,
        region: formData.region,
        emergencyContact: {
          name: formData.emergencyContactName,
          phone: formData.emergencyContactPhone,
          relationship: formData.emergencyContactRelationship
        },
        medicalHistory: formData.medicalHistory
          ? formData.medicalHistory.split(',').map(item => item.trim()).filter(Boolean)
          : [],
        allergies: formData.allergies
          ? formData.allergies.split(',').map(item => item.trim()).filter(Boolean)
          : [],
      };

      if (formData.isPregnant) {
        const riskMap: Record<string, string> = { low: 'Low', medium: 'Medium', high: 'High' };
        patientData.currentPregnancy = {
          isPregnant: true,
          gestationalAge: formData.gestationalAge ? Number(formData.gestationalAge) : undefined,
          estimatedDueDate: formData.estimatedDueDate || undefined,
          riskLevel: riskMap[formData.riskLevel] || 'Low'
        };
      }

      const response = await patientsAPI.createPatient(patientData);
      const createdPatient = (response?.data as any)?.patient || response?.data;
      if (response.success && createdPatient) {
        onPatientAdded?.(createdPatient);
        onClose();
        resetForm();
      } else {
        setError(response.message || 'Failed to create patient');
      }
    } catch (error) {
      console.error('Error creating patient:', error);
      setError('Failed to create patient. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: '',
      address: '',
      facility: '',
      region: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelationship: '',
      medicalHistory: '',
      allergies: '',
      isPregnant: false,
      gestationalAge: '',
      estimatedDueDate: '',
      riskLevel: 'low'
    });
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserPlus className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Add New Patient</h2>
                <p className="text-sm text-gray-600">Register a new patient in the system</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          <div className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender *
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  placeholder="Enter full address"
                  required
                />
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Facility *
                  </label>
                  <input
                    type="text"
                    name="facility"
                    value={formData.facility}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Region *
                  </label>
                  <input
                    type="text"
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    name="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    name="emergencyContactPhone"
                    value={formData.emergencyContactPhone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relationship *
                  </label>
                  <select
                    name="emergencyContactRelationship"
                    value={formData.emergencyContactRelationship}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Relationship</option>
                    <option value="spouse">Spouse</option>
                    <option value="parent">Parent</option>
                    <option value="sibling">Sibling</option>
                    <option value="child">Child</option>
                    <option value="friend">Friend</option>
                    <option value="guardian">Guardian</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Medical Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medical History
                  </label>
                  <textarea
                    name="medicalHistory"
                    value={formData.medicalHistory}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    placeholder="Enter medical history (separate multiple conditions with commas)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allergies
                  </label>
                  <textarea
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    placeholder="Enter known allergies (separate multiple allergies with commas)"
                  />
                </div>
              </div>
            </div>

            {/* Pregnancy Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Pregnancy Information</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="isPregnant"
                    checked={formData.isPregnant}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Currently Pregnant
                  </label>
                </div>

                {formData.isPregnant && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-7">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gestational Age (weeks)
                      </label>
                      <input
                        type="number"
                        name="gestationalAge"
                        value={formData.gestationalAge}
                        onChange={handleInputChange}
                        min="0"
                        max="42"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estimated Due Date
                      </label>
                      <input
                        type="date"
                        name="estimatedDueDate"
                        value={formData.estimatedDueDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Risk Level
                      </label>
                      <select
                        name="riskLevel"
                        value={formData.riskLevel}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="low">Low Risk</option>
                        <option value="medium">Medium Risk</option>
                        <option value="high">High Risk</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              * Required fields
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {loading ? 'Creating...' : 'Create Patient'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPatientModal;

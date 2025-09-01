import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { fetchUserData, updateUser } from '../../utils/apiClient';

export function Profile() {
  // State for user data
  const [userData, setUserData] = useState({
    fullName: '',
    email: '',
    financialYearStart: 'january',
  });
  const [saving, setSaving] = useState(false); // State for save button

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserData()
      .then((data) => {
        setUserData({
          fullName: data.full_name || '',
          email: data.email || '',
          financialYearStart: data.financial_year_start || 'january',
        });
      })
      .catch((error) => console.error('Error fetching user data:', error));
  }, []);

  const handleInputChange = (key: keyof typeof userData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.value;
    setUserData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      await updateUser({ full_name: userData.fullName }); // Update only the name in the database
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating user data:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Profile & Settings
        </h2>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={userData.fullName}
              onChange={handleInputChange('fullName')}
              placeholder="Enter your full name"
            />
            <Input
              label="Email"
              type="email"
              value={userData.email}
              readOnly // Make email non-editable
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Financial Year Start"
              value={userData.financialYearStart}
              onChange={handleInputChange('financialYearStart')}
              options={[
                { value: 'january', label: 'January' },
                { value: 'april', label: 'April' },
                { value: 'july', label: 'July' },
                { value: 'october', label: 'October' }
              ]}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6">
            <Button variant="secondary" disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveChanges} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
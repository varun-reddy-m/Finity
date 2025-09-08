import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { fetchUserData, updateUser, fetchCategories, addCategory as addCategoryApi } from '../../utils/apiClient';

export function Profile() {
  // State for user data
  const [userData, setUserData] = useState({
    fullName: '',
    email: '',
    financialYearStart: 'january',
  });
  const [saving, setSaving] = useState(false); // State for save button
  const [newCategory, setNewCategory] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

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

  useEffect(() => {
    fetchCategories()
      .then((data) => setCategories(data))
      .catch((error) => console.error('Error fetching categories:', error));
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

  const addCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;
    setAddingCategory(true);
    try {
      const response = await addCategoryApi(name); // Ensure the payload matches the API contract
      setNewCategory('');
      setCategories((prev) => [...prev, response]); // Update categories with the new category
      alert('Category added successfully');
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Failed to add category');
    } finally {
      setAddingCategory(false);
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
              readOnly 
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

      <div className="space-y-4 mt-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Categories</h3>
        <div className="flex items-center mt-3">
          <Input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="New category"
          />
          <Button onClick={addCategory} className="ml-2" disabled={addingCategory}>
            {addingCategory ? 'Adding...' : '+ Add'}
          </Button>
        </div>
        {categories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Card key={category.id}>
                <p className="text-gray-800 dark:text-gray-200">{category.name}</p>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No categories available.</p>
        )}
      </div>
    </div>
  );
}
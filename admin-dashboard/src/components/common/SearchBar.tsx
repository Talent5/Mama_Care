import React, { useState, useRef, useEffect } from 'react';
import { Search, Users, User, Calendar, FileText, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { searchService } from '../../services/searchService';
import { useAuth } from '../../hooks/useAuth';

// Local type definitions to avoid coupling to service module type exports
type SearchEntityType = 'patient' | 'user' | 'appointment';
type SearchResult = {
  id: string;
  type: SearchEntityType;
  title: string;
  subtitle: string;
  avatar?: string;
  metadata?: Record<string, unknown>;
};
type SearchResponse = {
  patients: SearchResult[];
  users: SearchResult[];
  appointments: SearchResult[];
  total: number;
};

interface SearchBarProps {
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ className = '' }) => {
  // Using the named export from the service
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResponse>({
    patients: [],
    users: [],
    appointments: [],
    total: 0
  });
  const [isSearching, setIsSearching] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    console.log('🔍 Search input changed:', query);
    console.log('👤 Current user:', user);
    setSearchQuery(query);
    
    if (query.trim()) {
      console.log('🚀 Starting search...');
      setIsSearching(true);
      setShowResults(true);
      
      // Test: Call search directly to bypass debounce
      console.log('🧪 Testing direct search call...');
      searchService.search(query).then(results => {
        console.log('🧪 Direct search results:', results);
        setSearchResults(results);
        setIsSearching(false);
      }).catch(error => {
        console.error('🧪 Direct search error:', error);
        setIsSearching(false);
      });
      
      // Use debounced search
      searchService.debouncedSearch(query, (results: SearchResponse) => {
        console.log('✅ Search results received:', results);
        setSearchResults(results);
        setIsSearching(false);
      });
    } else {
      console.log('❌ Empty query, clearing results');
      setShowResults(false);
      setSearchResults({
        patients: [],
        users: [],
        appointments: [],
        total: 0
      });
    }
  };

  // Handle search result click
  const handleResultClick = (result: SearchResult) => {
    setShowResults(false);
    setSearchQuery('');
    
    // Navigate based on type using React Router
    if (result.type === 'patient') {
      // Navigate to patients page with the specific patient ID as a URL parameter
      navigate(`/patients?id=${result.id}`);
    } else if (result.type === 'user') {
      // Navigate to users page with the specific user ID as a URL parameter  
      navigate(`/users?id=${result.id}`);
    } else if (result.type === 'appointment') {
      // Navigate to appointments page with the specific appointment ID as a URL parameter
      navigate(`/appointments?id=${result.id}`);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowResults(false);
    }
  };

  // Get icon for search result type
  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'patient':
        return <Users className="w-4 h-4 text-blue-500" />;
      case 'user':
        return <User className="w-4 h-4 text-green-500" />;
      case 'appointment':
        return <Calendar className="w-4 h-4 text-purple-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search patients, users, appointments..."
          value={searchQuery}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10 py-2 w-full border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4ea674] focus:border-transparent transition-all duration-200 text-sm bg-gray-50 focus:bg-white"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="w-4 h-4 animate-spin text-[#4ea674]" />
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && searchQuery.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
          {searchResults.total === 0 && !isSearching ? (
            <div className="p-6 text-center text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="font-medium">No results found</p>
              <p className="text-sm text-gray-400 mt-1">Try searching with different keywords</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {/* Patients Section */}
              {searchResults.patients.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Patients ({searchResults.patients.length})
                    </h4>
                  </div>
                  {searchResults.patients.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
                    >
                      {getResultIcon(result.type)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{result.title}</p>
                        <p className="text-sm text-gray-500 truncate">{result.subtitle}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {result.metadata?.riskLevel === 'high' && (
                          <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">High Risk</span>
                        )}
                        {(result.metadata?.isPregnant as boolean) && (
                          <span className="px-2 py-1 bg-pink-100 text-pink-600 text-xs rounded-full">Pregnant</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Users Section */}
              {searchResults.users.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Users ({searchResults.users.length})
                    </h4>
                  </div>
                  {searchResults.users.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
                    >
                      {getResultIcon(result.type)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{result.title}</p>
                        <p className="text-sm text-gray-500 truncate">{result.subtitle}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {!(result.metadata?.isActive as boolean) && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Inactive</span>
                        )}
                        <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                          (result.metadata?.role as string) === 'doctor' ? 'bg-blue-100 text-blue-600' :
                          (result.metadata?.role as string) === 'nurse' ? 'bg-green-100 text-green-600' :
                          (result.metadata?.role as string) === 'system_admin' ? 'bg-purple-100 text-purple-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {((result.metadata?.role as string) || 'User').replace('_', ' ')}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Appointments Section */}
              {searchResults.appointments.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Appointments ({searchResults.appointments.length})
                    </h4>
                  </div>
                  {searchResults.appointments.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
                    >
                      {getResultIcon(result.type)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{result.title}</p>
                        <p className="text-sm text-gray-500 truncate">{result.subtitle}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          (result.metadata?.status as string) === 'completed' ? 'bg-green-100 text-green-600' :
                          (result.metadata?.status as string) === 'cancelled' ? 'bg-red-100 text-red-600' :
                          (result.metadata?.status as string) === 'confirmed' ? 'bg-blue-100 text-blue-600' :
                          'bg-yellow-100 text-yellow-600'
                        }`}>
                          {(result.metadata?.status as string) || 'Unknown'}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full capitalize">
                          {(result.metadata?.type as string) || 'Consultation'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Search Footer */}
          {searchResults.total > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {searchResults.total} result{searchResults.total !== 1 ? 's' : ''} for "{searchQuery}"
                </p>
                <button className="text-sm text-[#4ea674] hover:text-[#3d8b5e] font-medium transition-colors">
                  Advanced Search
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;

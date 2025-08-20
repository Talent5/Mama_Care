/**
 * Greeting utilities for MamaCare app
 * Generates dynamic greetings based on time of day and user information
 */

export interface GreetingOptions {
  includeTime?: boolean;
  includeEmoji?: boolean;
  language?: 'en' | 'sw' | 'sn'; // English, Swahili, Shona
}

/**
 * Get time-based greeting
 */
export const getTimeBasedGreeting = (options: GreetingOptions = {}): string => {
  const { includeEmoji = false, language = 'en' } = options;
  const hour = new Date().getHours();
  
  let greeting = '';
  let emoji = '';
  
  if (hour >= 5 && hour < 12) {
    // Morning: 5 AM - 11:59 AM
    switch (language) {
      case 'sw':
        greeting = 'Habari za asubuhi';
        break;
      case 'sn':
        greeting = 'Mangwanani';
        break;
      default:
        greeting = 'Good morning';
    }
    emoji = '🌅';
  } else if (hour >= 12 && hour < 17) {
    // Afternoon: 12 PM - 4:59 PM
    switch (language) {
      case 'sw':
        greeting = 'Habari za mchana';
        break;
      case 'sn':
        greeting = 'Masikati';
        break;
      default:
        greeting = 'Good afternoon';
    }
    emoji = '☀️';
  } else if (hour >= 17 && hour < 21) {
    // Evening: 5 PM - 8:59 PM
    switch (language) {
      case 'sw':
        greeting = 'Habari za jioni';
        break;
      case 'sn':
        greeting = 'Manheru';
        break;
      default:
        greeting = 'Good evening';
    }
    emoji = '🌆';
  } else {
    // Night: 9 PM - 4:59 AM
    switch (language) {
      case 'sw':
        greeting = 'Habari za usiku';
        break;
      case 'sn':
        greeting = 'Manheru';
        break;
      default:
        greeting = 'Good evening';
    }
    emoji = '🌙';
  }
  
  return includeEmoji ? `${emoji} ${greeting}` : greeting;
};

/**
 * Get personalized greeting for a user
 */
export const getPersonalizedGreeting = (
  user: { firstName?: string; fullName?: string; role?: string } | null | undefined,
  options: GreetingOptions = {}
): string => {
  const timeGreeting = getTimeBasedGreeting(options);
  
  if (!user) {
    return `${timeGreeting}, Mama!`;
  }
  
  // Get user's first name
  const firstName = user.firstName || user.fullName?.split(' ')[0] || 'Mama';
  
  // Add role-specific prefix for healthcare providers
  let nameWithTitle = firstName;
  if (user.role) {
    switch (user.role.toLowerCase()) {
      case 'doctor':
        nameWithTitle = `Dr. ${firstName}`;
        break;
      case 'nurse':
        nameWithTitle = `Nurse ${firstName}`;
        break;
      case 'admin':
        nameWithTitle = `${firstName}`;
        break;
      case 'patient':
      default:
        nameWithTitle = firstName;
    }
  }
  
  return `${timeGreeting}, ${nameWithTitle}!`;
};

/**
 * Get contextual greeting message based on user role and time
 */
export const getContextualMessage = (
  user: { role?: string } | null | undefined,
  options: GreetingOptions = {}
): string => {
  const { language = 'en' } = options;
  const hour = new Date().getHours();
  
  if (!user || !user.role) {
    return language === 'sw' ? 'Karibu kwenye MamaCare' : 
           language === 'sn' ? 'Mauya ku MamaCare' :
           'Welcome to MamaCare';
  }
  
  const role = user.role.toLowerCase();
  
  // Morning messages
  if (hour >= 5 && hour < 12) {
    switch (role) {
      case 'doctor':
        return language === 'sw' ? 'Mchana mwema wa kazi!' :
               language === 'sn' ? 'Mangwanani akanaka ebasa!' :
               'Ready for a productive day ahead!';
      case 'nurse':
        return language === 'sw' ? 'Siku njema ya huduma!' :
               language === 'sn' ? 'Zuva rakanaka rekushanda!' :
               'Another day of caring for mothers!';
      case 'admin':
        return language === 'sw' ? 'Mchana mwema wa uongozi!' :
               language === 'sn' ? 'Mangwanani akanaka ekutungamira!' :
               'Ready to manage the system today!';
      default:
        return language === 'sw' ? 'Siku njema ya afya!' :
               language === 'sn' ? 'Zuva rakanaka rehutano!' :
               'Have a healthy day ahead!';
    }
  }
  
  // Afternoon messages
  if (hour >= 12 && hour < 17) {
    switch (role) {
      case 'doctor':
        return language === 'sw' ? 'Mchana wa kazi unaendelea vizuri!' :
               language === 'sn' ? 'Masikati anofamba zvakanaka!' :
               'Hope your afternoon is going well!';
      case 'nurse':
        return language === 'sw' ? 'Huduma za mchana zinaendelea!' :
               language === 'sn' ? 'Kubatsira kwamasikati kunofamba!' :
               'Continuing great care this afternoon!';
      case 'admin':
        return language === 'sw' ? 'Mchana wa uongozi mzuri!' :
               language === 'sn' ? 'Masikati akanaka ekutungamira!' :
               'Managing things well this afternoon!';
      default:
        return language === 'sw' ? 'Mchana mwema!' :
               language === 'sn' ? 'Masikati akanaka!' :
               'Hope your afternoon is great!';
    }
  }
  
  // Evening/Night messages
  switch (role) {
    case 'doctor':
      return language === 'sw' ? 'Heri ya jioni!' :
             language === 'sn' ? 'Manheru akanaka!' :
             'Winding down from a productive day!';
    case 'nurse':
      return language === 'sw' ? 'Jioni ya huduma nzuri!' :
             language === 'sn' ? 'Manheru ekushanda zvakanaka!' :
             'Great work caring for mothers today!';
    case 'admin':
      return language === 'sw' ? 'Jioni ya uongozi mzuri!' :
             language === 'sn' ? 'Manheru akanaka ekutungamira!' :
             'System running smoothly this evening!';
    default:
      return language === 'sw' ? 'Jioni njema!' :
             language === 'sn' ? 'Manheru akanaka!' :
             'Have a peaceful evening!';
  }
};

/**
 * Get complete greeting with message
 */
export const getCompleteGreeting = (
  user: { firstName?: string; fullName?: string; role?: string } | null | undefined,
  options: GreetingOptions = {}
): { greeting: string; message: string } => {
  return {
    greeting: getPersonalizedGreeting(user, options),
    message: getContextualMessage(user, options)
  };
};

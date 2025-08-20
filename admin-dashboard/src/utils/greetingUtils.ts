/**
 * Greeting utilities for MamaCare Admin Dashboard
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
    return `${timeGreeting}!`;
  }
  
  // Get user's first name
  const firstName = user.firstName || user.fullName?.split(' ')[0] || 'User';
  
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
      case 'system_admin':
        nameWithTitle = `${firstName}`;
        break;
      case 'patient':
      default:
        nameWithTitle = firstName;
    }
  }
  
  return `${timeGreeting}, ${nameWithTitle}`;
};

/**
 * Get contextual message based on user role and time
 */
export const getContextualMessage = (
  user: { role?: string } | null | undefined,
  options: GreetingOptions = {}
): string => {
  const { language = 'en' } = options;
  const hour = new Date().getHours();
  
  if (!user || !user.role) {
    return language === 'sw' ? 'Karibu kwenye MamaCare Admin' : 
           language === 'sn' ? 'Mauya ku MamaCare Admin' :
           'Welcome to MamaCare Admin Dashboard';
  }
  
  const role = user.role.toLowerCase();
  
  // Morning messages
  if (hour >= 5 && hour < 12) {
    switch (role) {
      case 'doctor':
        return language === 'sw' ? 'Mchana mwema wa kazi - takwimu za leo hapa' :
               language === 'sn' ? 'Mangwanani akanaka ebasa - mamiriro ezhinji azvino' :
               "Here's your clinical overview for today";
      case 'nurse':
        return language === 'sw' ? 'Siku njema ya huduma - takwimu za mama' :
               language === 'sn' ? 'Zuva rakanaka rekuchengeta - mamiriro amai' :
               'Your maternal care dashboard for today';
      case 'admin':
      case 'system_admin':
        return language === 'sw' ? 'Mchana mwema wa uongozi - muhtasari wa mfumo' :
               language === 'sn' ? 'Mangwanani akanaka ekutungamira - pfupiso yesistem' :
               'System overview and management dashboard';
      default:
        return language === 'sw' ? 'Siku njema ya kazi!' :
               language === 'sn' ? 'Zuva rakanaka rebasa!' :
               'Ready for a productive day!';
    }
  }
  
  // Afternoon messages
  if (hour >= 12 && hour < 17) {
    switch (role) {
      case 'doctor':
        return language === 'sw' ? 'Mchana wa kazi unaendelea - angalia hali za wagonjwa' :
               language === 'sn' ? 'Masikati anofamba - tarisa mamiriro evarwere' :
               'Afternoon clinical overview and patient status';
      case 'nurse':
        return language === 'sw' ? 'Huduma za mchana zinaendelea - kazi ya mama' :
               language === 'sn' ? 'Masikati ekuchengeta - basa ramai' :
               'Continuing maternal care this afternoon';
      case 'admin':
      case 'system_admin':
        return language === 'sw' ? 'Mchana wa uongozi - angalia mfumo' :
               language === 'sn' ? 'Masikati ekutungamira - tarisa system' :
               'Afternoon system monitoring and management';
      default:
        return language === 'sw' ? 'Mchana mwema wa kazi!' :
               language === 'sn' ? 'Masikati akanaka ebasa!' :
               'Hope your afternoon is productive!';
    }
  }
  
  // Evening/Night messages
  switch (role) {
    case 'doctor':
      return language === 'sw' ? 'Jioni - angalia takwimu za siku' :
             language === 'sn' ? 'Manheru - tarisa mamiriro ezuva' :
             'Evening clinical summary and patient updates';
    case 'nurse':
      return language === 'sw' ? 'Jioni ya huduma - muhtasari wa mama' :
             language === 'sn' ? 'Manheru wekuchengeta - pfupiso yamai' :
             'Evening maternal care summary';
    case 'admin':
    case 'system_admin':
      return language === 'sw' ? 'Jioni - muhtasari wa mfumo' :
             language === 'sn' ? 'Manheru - pfupiso yesystem' :
             'Evening system status and daily summary';
    default:
      return language === 'sw' ? 'Jioni njema ya kazi!' :
             language === 'sn' ? 'Manheru akanaka ebasa!' :
             'Good evening, hope you had a productive day!';
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

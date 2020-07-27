/* Change baseUrl service API in production object */
// const switchUrl = {
//   localhost: {
//     serverUrl: 'https://api.aspenclubsoftware.com/webole.asp',
//     photoPath: 'https://api.aspenclubsoftware.com/PHOTO/',
//   },
//   'lg.aspenclubsoftware.com': {
//     serverUrl: 'https://api.aspenclubsoftware.com/webole.asp',
//     photoPath: 'https://api.aspenclubsoftware.com/PHOTO/',
//   },
//   'golfres-system.com': {
//     serverUrl: 'https://api.lagunanational.com/webole.asp',
//     photoPath: 'https://api.lagunanational.com/PHOTO/',
//   },
// };
window.config = {
  // ...switchUrl[window.location.hostname],
  serverUrl: (function() {
    switch (window.location.hostname) {
      case 'lg.aspenclubsoftware.com':
        return 'https://api.aspenclubsoftware.com/webole.asp';
      case 'golfres-system.com':
        return 'https://api.lagunanational.com/webole.asp';
      default:
        return 'http://localhost:5050/';
        // return 'https://api.aspenclubsoftware.com/webole.asp';
        // return 'https://api.lagunanational.com/';
        // return 'http://49.0.81.208:1002/webole.asp';
        // return 'https://api.lagunanational.com/webole.asp';
    }
  })(),
  photoPath: (function() {
    switch (window.location.hostname) {
      case 'lg.aspenclubsoftware.com':
        return 'https://api.aspenclubsoftware.com/PHOTO/';
      case 'golfres-system.com':
        return 'https://api.lagunanational.com/PHOTO/';
      default:
        return 'https://api.lagunanational.com/PHOTO/';
    }
  })(),
  /* Time Setting period Insert Object course code ex (CC),(MC) */
  courseCodeSettings: ['CC', 'MC' , 'CC11' , 'MC11'],
  courseHardCode: [
    {COUR_CODE: "CC", COUR_NAME: "Classic Course"},
    {COUR_CODE: "MC", COUR_NAME: "Masters Course"},
  ], 
  timeSetting: {
    format: 'HH:mm',
    period: {
      CC: [
        {
          label: 'Morning',
          value: ['07:00', '11:59'],
          active: true,
        },
        {
          label: 'Afternoon',
          value: ['12:00', '17:31'],
          active: true,
        },
      ],
      MC: [
        {
          label: 'Morning',
          value: ['07:00', '11:59'],
          active: true,
        },
        {
          label: 'Afternoon',
          value: ['12:00', '17:33'],
          active: true,
        },
      ],
    CC11: [
        {
          label: 'Morning',
          value: ['07:00', '11:59'],
          active: true,
        },
        {
          label: 'Afternoon',
          value: ['12:00', '18:30'],
          active: true,
        },
      ],
    MC11: [
        {
          label: 'Morning',
          value: ['07:00', '11:59'],
          active: true,
        },
        {
          label: 'Afternoon',
          value: ['12:00', '18:30'],
          active: true,
        },
      ],
    },
    // Today hour, After this time last Available day for booking will be increased
    nextDayOpensHour: 7,
    // set day can book. ex 0 = Can book today, 1 = Can start booking tomorrow
    setBookingToday: 1,
    // limit day for Booking (Weekday) ** In (Weekend) Calcualte By Weekday. ex 8 weekend = 10, 7 weekend = 9
    advBookingWeekday: 7,
    // limit day for Booking (Public Holiday) ** check from today to advBookingPHday
    advBookingPhday: 0,
  },
  dateSetting: {
    format: 'DD MMM YYYY',
    serviceFormat: 'DD-MM-YYYY',
    datePicker: 'DD/MM/YYYY',
    strFormat: 'LLL',
    duration: 30,
  },
  eMailSetting: {
    receiver: '[{"email":"aspen@genex-solutions.com","name":"ManagerName"}]',
  },
  // seconds, 0...1800 = 30min
  autoLogout: 600,
};

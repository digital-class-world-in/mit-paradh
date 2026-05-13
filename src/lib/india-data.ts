export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", 
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

export const DISTRICT_MAP: Record<string, string[]> = {
  "Maharashtra": [
    "Ahmednagar", "Akola", "Amravati", "Aurangabad (Chhatrapati Sambhajinagar)", 
    "Beed", "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", 
    "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur", 
    "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar", 
    "Nashik", "Osmanabad", "Palghar", "Parbhani", "Pune", "Raigad", 
    "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", 
    "Wardha", "Washim", "Yavatmal"
  ],
  "Gujarat": ["Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch", "Bhavnagar", "Botad", "Chhota Udepur", "Dahod", "Dang", "Devbhoomi Dwarka", "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagadh", "Kutch", "Kheda", "Mahisagar", "Mehsana", "Morbi", "Narmada", "Navsari", "Panchmahal", "Patan", "Porbandar", "Rajkot", "Sabarkantha", "Surat", "Surendranagar", "Tapi", "Vadodara", "Valsad"],
  "Karnataka": ["Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", "Bidar", "Chamarajanagar", "Chikkaballapur", "Chikkamagaluru", "Chitradurga", "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada", "Vijayapura", "Yadgir"],
  // Add other states as needed...
};

export const TALUKA_MAP: Record<string, string[]> = {
  "Aurangabad (Chhatrapati Sambhajinagar)": [
    "Aurangabad", "Sillod", "Soegaon", "Phulambri", "Kannad", "Khultabad", "Paithan", "Gangapur", "Vaijapur"
  ],
  "Jalna": [
    "Jalna", "Badnapur", "Bhokardan", "Jafrabad", "Partur", "Mantha", "Ambad", "Ghansawangi"
  ],
  "Pune": [
    "Pune City", "Haveli", "Khed", "Ambegaon", "Junnat", "Shirur", "Daund", "Indapur", "Baramati", "Purandar", "Bhor", "Velhe", "Mulshi", "Maval"
  ]
};

export const RELIGIONS = [
  "Hindu", "Muslim", "Christian", "Sikh", "Buddhist", "Jain", "Parsi", "Other"
];

export const CASTE_CATEGORIES = [
  "Open", "OBC", "SC", "ST", "VJNT", "SBC", "EWS", "SEBC"
];

export const EXAMINATIONS = [
  "SSC", "HSC", "Graduation", "Post Graduation", "Diploma", "ITI", "Other"
];

export const BOARDS = [
  "Maharashtra State Board", 
  "CBSE (Central Board of Secondary Education)", 
  "ICSE (Indian Certificate of Secondary Education)", 
  "NIOS (National Institute of Open Schooling)",
  "UP Board (Uttar Pradesh)",
  "Bihar School Examination Board",
  "West Bengal Board of Secondary Education",
  "Karnataka Secondary Education Examination Board",
  "Tamil Nadu State Board",
  "Kerala State Education Board",
  "Rajasthan Board of Secondary Education",
  "Gujarat Secondary and Higher Secondary Education Board",
  "Andhra Pradesh Board of Intermediate Education",
  "Telangana State Board of Intermediate Education",
  "Savitribai Phule Pune University (SPPU)", 
  "Dr. Babasaheb Ambedkar Marathwada University (BAMU)", 
  "University of Mumbai", 
  "Shivaji University, Kolhapur", 
  "University of Delhi",
  "Jawaharlal Nehru University (JNU)",
  "Anna University (Tamil Nadu)",
  "Visvesvaraya Technological University (VTU - Karnataka)",
  "Jawaharlal Nehru Technological University (JNTU - Telangana/AP)",
  "Osmania University (Telangana)",
  "Indira Gandhi National Open University (IGNOU)",
  "Banaras Hindu University (BHU)",
  "Andhra University (Andhra Pradesh)",
  "Gauhati University (Assam)",
  "Patna University (Bihar)",
  "Gujarat University",
  "Kurukshetra University (Haryana)",
  "University of Kerala",
  "Barkatullah University (Madhya Pradesh)",
  "Utkal University (Odisha)",
  "Panjab University (Chandigarh)",
  "University of Rajasthan",
  "University of Calcutta (West Bengal)",
  "University of Lucknow (Uttar Pradesh)",
  "Madras University (Tamil Nadu)",
  "Bangalore University (Karnataka)",
  "Calicut University (Kerala)",
  "Himachal Pradesh University",
  "Jammu University",
  "Kashmir University",
  "Other"
];

export const BLOOD_GROUPS = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"
];

export const LANGUAGES = [
  "Marathi", "Hindi", "English", "Assamese", "Bengali", "Bodo", "Dogri", "Gujarati", 
  "Kannada", "Kashmiri", "Konkani", "Maithili", "Malayalam", "Meitei (Manipuri)", 
  "Nepali", "Odia", "Punjabi", "Sanskrit", "Santali", "Sindhi", "Tamil", "Telugu", "Urdu"
];

export const DISABILITY_TYPES = [
  "Blindness", "Low-Vision", "Locomotor Disability", "Hearing Impairment", 
  "Intellectual Disability", "Mental Illness", "Autism Spectrum Disorder", 
  "Cerebral Palsy", "Muscular Dystrophy", "Chronic Neurological Conditions", 
  "Specific Learning Disabilities", "Multiple Sclerosis", "Speech and Language Disability", 
  "Thalassemia", "Hemophilia", "Sickle Cell Disease", "Multiple Disabilities", "Other"
];

export const ACCOUNT_TYPES = ["Saving", "Current"];

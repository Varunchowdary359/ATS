import React from 'react';

const PublicJobPosting = ({ jd, onBack }) => {
  // Use dummy data if no JD is passed (for previewing the raw component)
  const data = jd || {
    title: 'Digital UX & UI Designer',
    dept: 'Design & Creative',
    location: 'New York, US',
    experience: 'Empty',
    summary: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce consectetur facilisis ullamcorper. Nam mauris lacus, dapibus eu risus id, mollis consectetur diam. Ut non mattis massa. Proin commodo posuere nibh, at porta nisi volutpat et. Suspendisse venenatis tortor metus, ut finibus nisl tempus in.',
    responsibilities: [
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      'Nam varius nunc eget aliquam euismod.',
      'Donec ac odio vulputate, scelerisque tortor quis, malesuada neque.',
      'Pellentesque nec justo vel orci ullamcorper consequat non condimentum felis.',
      'Phasellus eleifend est ac orci sollicitudin varius.'
    ],
    requirements: [
      'Etiam a mi ultricies, fringilla est ut, tempor mi.',
      'Donec laoreet lacus eu eros porttitor suscipit.',
      'Quisque sit amet nisi sed nisl lacinia pretium at quis eros.',
      'Suspendisse auctor arcu ac accumsan ultrices.',
      'Ut faucibus metus ac suscipit pellentesque.'
    ],
    date: 'April 5, 2026'
  };

  return (
    <div className="w-full min-h-screen bg-[#FDFDFD] font-sans text-slate-800 animate-fade-in-up">
      {/* Navigation / Back Button */}
      <div className="max-w-[1100px] mx-auto px-6 py-4 flex items-center gap-2">
        <button onClick={onBack} className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Dashboard
        </button>
      </div>

      <div className="max-w-[1100px] mx-auto px-6 pb-20">
        
        {/* Hero Section */}
        <div className="w-full h-[250px] sm:h-[350px] bg-slate-200 rounded-[20px] mb-12 relative overflow-hidden">
          <img src="https://images.unsplash.com/photo-1593642632823-8f785ba67e45?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" alt="Workspace" className="w-full h-full object-cover" />
          {/* Laptop Icon overlay */}
          <div className="absolute -bottom-6 left-10 w-16 h-16 bg-white rounded-xl shadow-md flex items-center justify-center p-3">
             <svg viewBox="0 0 24 24" fill="currentColor" className="text-slate-800 w-full h-full"><path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/></svg>
          </div>
        </div>

        {/* Header & Meta */}
        <div className="mb-8 pl-4">
          <h1 className="text-4xl font-bold mb-8 text-slate-900 tracking-tight">{data.title}</h1>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-12 text-sm text-slate-600 mb-8 max-w-[800px]">
            <div className="flex items-center gap-3">
              <span className="w-5 text-slate-400 flex justify-center"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></span>
              <span className="w-24">Job Type</span>
              <span className="font-semibold text-slate-900">Remote</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-5 text-slate-400 flex justify-center"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg></span>
              <span className="w-24">Category</span>
              <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md text-xs">{data.dept}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-5 text-slate-400 flex justify-center"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg></span>
              <span className="w-24">Location</span>
              <span className="font-semibold text-slate-900">{data.location}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-5 text-slate-400 flex justify-center"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></span>
              <span className="w-24">Experience</span>
              <span className="font-semibold text-slate-900">{data.experience}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-5 text-slate-400 flex justify-center"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></span>
              <span className="w-24">Salary</span>
              <span className="font-semibold text-slate-900">$6,000 / month</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-5 text-slate-400 flex justify-center"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></span>
              <span className="w-24">Deadline</span>
              <span className="font-semibold text-slate-900">April 30, 2027</span>
            </div>
          </div>

          {/* Breadcrumbs */}
          <div className="border-t border-b border-slate-100 py-3 mb-10 flex items-center gap-2 text-xs text-slate-500 font-semibold">
             <span>Job Board</span>
             <span>/</span>
             <span>Job Board Jobs</span>
             <span>/</span>
             <span className="text-slate-800 flex items-center gap-2"><svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/></svg> {data.title}</span>
          </div>
        </div>

        {/* Main Content Split */}
        <div className="flex flex-col lg:flex-row gap-12 pl-4">
          
          {/* Left Column (Job Info) */}
          <div className="w-full lg:w-[60%] flex flex-col gap-10">
            <section>
              <h2 className="text-lg font-bold mb-4 text-slate-900">About the Role</h2>
              <p className="text-sm text-slate-700 leading-relaxed">{data.summary}</p>
            </section>
            
            <section>
              <h2 className="text-lg font-bold mb-4 text-slate-900">Responsibilities</h2>
              <ul className="list-disc pl-5 flex flex-col gap-3 text-sm text-slate-700 leading-relaxed">
                {data.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </section>
            
            <section>
              <h2 className="text-lg font-bold mb-4 text-slate-900">Requirements</h2>
              <ul className="list-disc pl-5 flex flex-col gap-3 text-sm text-slate-700 leading-relaxed">
                {data.requirements.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-4 text-slate-900">Nice to have</h2>
              <ul className="list-disc pl-5 flex flex-col gap-3 text-sm text-slate-700 leading-relaxed">
                <li>Phasellus molestie arcu vitae odio viverra egestas.</li>
                <li>Suspendisse dictum arcu at laoreet semper.</li>
                <li>Nullam ut lectus non tellus malesuada placerat.</li>
              </ul>
            </section>
          </div>

          {/* Right Column (Application Form) */}
          <div className="w-full lg:w-[40%]">
            <div className="border border-slate-200 rounded-[12px] bg-white p-8 sticky top-8 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                 <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                 <span className="text-xs font-semibold text-slate-500 tracking-wide">Application</span>
              </div>
              <h2 className="text-xl font-bold mb-8 text-slate-900">Apply for this position</h2>

              <form className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-700">Full Name <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="First Name" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:border-slate-400 focus:outline-none placeholder:text-slate-300" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-700">Email Address <span className="text-red-500">*</span></label>
                  <input type="email" placeholder="Email Address" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:border-slate-400 focus:outline-none placeholder:text-slate-300" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-700">Phone Number <span className="text-red-500">*</span></label>
                  <input type="tel" placeholder="Phone Number" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:border-slate-400 focus:outline-none placeholder:text-slate-300" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-700">Available From <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="Select Date" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:border-slate-400 focus:outline-none placeholder:text-slate-300" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-700">Expected salary <span className="text-red-500">*</span></label>
                  <input type="text" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:border-slate-400 focus:outline-none" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-700">LinkedIn <span className="text-red-500">*</span></label>
                  <input type="url" placeholder="LinkedIn Profile URL" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:border-slate-400 focus:outline-none placeholder:text-slate-300" />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-700">Upload your CV <span className="text-red-500">*</span></label>
                  <div className="border border-dashed border-slate-300 rounded-md p-6 flex flex-col items-center justify-center bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition-colors">
                    <span className="text-xs text-slate-600 flex items-center gap-2 mb-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      Click to choose a file or drag here
                    </span>
                    <span className="text-[10px] text-slate-400">Size limit: 10 MB</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-700">About <span className="text-red-500">*</span></label>
                  <textarea rows="4" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:border-slate-400 focus:outline-none resize-none"></textarea>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <button type="button" className="bg-black text-white px-5 py-2 rounded-md text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-2">
                    Submit <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </button>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                    <span className="text-pink-500 text-lg leading-none">✻</span> Made with Tally
                  </span>
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PublicJobPosting;

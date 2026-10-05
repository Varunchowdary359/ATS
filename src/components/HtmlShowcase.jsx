import React, { useState } from 'react';

// Database of HTML tags matching the FING PDF reference chart
const htmlTagsData = [
  {
    tag: '<!--',
    name: 'comment',
    category: 'Structure',
    code: '<!-- This is a comment. It will not be rendered by the browser -->\n<p>Only this paragraph text is visible.</p>',
    browserView: 'Only this paragraph text is visible. (The comment remains hidden in the source)',
    explanation: 'Used to insert comments in the source code. Comments are not displayed in the browsers.'
  },
  {
    tag: '<a>',
    name: 'anchor',
    category: 'Links & Media',
    code: '<a href="https://www.google.com" target="_blank" rel="noopener noreferrer" style="color: #0284c7; text-decoration: underline; font-weight: 600;">Visit Google</a>',
    browserView: null,
    explanation: 'Defines a hyperlink, which is used to link from one page to another.'
  },
  {
    tag: '<b>',
    name: 'bold',
    category: 'Text Formatting',
    code: 'This is <b>bold</b> text.',
    browserView: null,
    explanation: 'Defines bold text without any extra importance.'
  },
  {
    tag: '<big>',
    name: 'big (text)',
    category: 'Text Formatting',
    code: 'This is <span style="font-size: 1.2em;">big</span> text (styled with CSS).',
    browserView: null,
    explanation: 'Defines bigger text. Deprecated in HTML5, styled using font-size in modern practice.'
  },
  {
    tag: '<body>',
    name: 'body of HTML document',
    category: 'Structure',
    code: '<div style="border: 1px dashed #cbd5e1; padding: 10px; border-radius: 6px; background-color: #f8fafc; font-size: 12px;">\n  <strong>Body Content representation</strong>\n  <p>All page content is enclosed here.</p>\n</div>',
    browserView: null,
    explanation: 'Defines the document\'s body. Contains all the visible contents.'
  },
  {
    tag: '<br>',
    name: 'line break',
    category: 'Text Formatting',
    code: 'Line One.<br>Line Two.',
    browserView: null,
    explanation: 'Inserts a single line break.'
  },
  {
    tag: '<center>',
    name: 'center',
    category: 'Text Formatting',
    code: '<div style="text-align: center; color: #0284c7; font-size: 13px;">Centered Content</div>',
    browserView: null,
    explanation: 'Centers the text alignment. Deprecated in HTML5, replaced by text-align style property.'
  },
  {
    tag: '<dd>',
    name: 'definition description',
    category: 'Lists',
    code: '<dl>\n  <dt>HTML</dt>\n  <dd style="margin-left: 15px; color: #475569; font-size: 12px;">Markup standard</dd>\n</dl>',
    browserView: null,
    explanation: 'Used to describe a term/name in a description list.'
  },
  {
    tag: '<dl>',
    name: 'definition list',
    category: 'Lists',
    code: '<dl style="font-size: 12px;">\n  <dt style="font-weight: bold;">Coffee</dt>\n  <dd style="color: #64748b;">Black drink</dd>\n</dl>',
    browserView: null,
    explanation: 'Defines a description list.'
  },
  {
    tag: '<dt>',
    name: 'definition term',
    category: 'Lists',
    code: '<dl>\n  <dt style="font-weight: bold; color: #4f46e5;">React</dt>\n  <dd>UI Library</dd>\n</dl>',
    browserView: null,
    explanation: 'Defines a term/name in a description list.'
  },
  {
    tag: '<em>',
    name: 'emphasis',
    category: 'Text Formatting',
    code: 'This is <em>emphasized</em> text.',
    browserView: null,
    explanation: 'Defines emphasized text (typically rendered in italics).'
  },
  {
    tag: '<embed>',
    name: 'embed object',
    category: 'Links & Media',
    code: '<div style="background: #f1f5f9; padding: 6px; border-radius: 6px; text-align: center; border: 1px solid #e2e8f0; font-size: 11px;">\n  <span>Embedded audio player representation</span>\n  <audio controls style="width: 100%; height: 32px; margin-top: 4px;">\n    <source src="https://www.w3schools.com/html/horse.mp3" type="audio/mpeg" />\n  </audio>\n</div>',
    browserView: null,
    explanation: 'Defines a container for an external resource.'
  },
  {
    tag: '<font>',
    name: 'font',
    category: 'Text Formatting',
    code: '<span style="font-family: \'Georgia\', serif; font-size: 14px; color: #dc2626;">Georgia styled text</span>',
    browserView: null,
    explanation: 'Defines font style, color, and size. Deprecated in HTML5; styled using CSS.'
  },
  {
    tag: '<form>',
    name: 'form',
    category: 'Forms & Input',
    code: '<form style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px; border-radius: 8px;" onSubmit="event.preventDefault(); alert(\'Submitted!\')">\n  <input type="text" placeholder="Your Name" style="width: 100%; padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 11px; margin-bottom: 6px;" required />\n  <button type="submit" style="background: #0284c7; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer; width: 100%;">Submit</button>\n</form>',
    browserView: null,
    explanation: 'Defines an HTML form for user input.'
  },
  {
    tag: '<h1> to <h6>',
    name: 'headings',
    category: 'Text Formatting',
    code: '<h2 style="font-size: 16px; font-weight: 700;">Heading 2</h2>\n<h3 style="font-size: 13px; font-weight: 600;">Heading 3</h3>',
    browserView: null,
    explanation: 'Defines HTML headings. H1 represents the most important heading, H6 the least.'
  },
  {
    tag: '<head>',
    name: 'heading of HTML document',
    category: 'Structure',
    code: '<title>Example Page Title</title>\n<meta name="description" content="Summary" />',
    browserView: '<div style="font-size: 11px; color: #64748b; font-style: italic;">Nothing renders visibly. Defines document metadata.</div>',
    explanation: 'Contains metadata/information for the document.'
  },
  {
    tag: '<hr>',
    name: 'horizontal rule',
    category: 'Text Formatting',
    code: '<p style="font-size: 11px;">Top</p><hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 6px 0;" /><p style="font-size: 11px;">Bottom</p>',
    browserView: null,
    explanation: 'Defines a thematic break in an HTML page (rendered as a horizontal rule/line).'
  },
  {
    tag: '<html>',
    name: 'hypertext markup language',
    category: 'Structure',
    code: '<html lang="en">\n  <!-- Root node -->\n</html>',
    browserView: '<div style="font-size: 11px; color: #64748b;">Root element wrapper. Encloses head and body.</div>',
    explanation: 'Defines the root of an HTML document.'
  },
  {
    tag: '<i>',
    name: 'italic',
    category: 'Text Formatting',
    code: 'This is <i>italicized</i> text.',
    browserView: null,
    explanation: 'Defines a part of text in an alternate voice or mood, typically rendered in italic.'
  },
  {
    tag: '<img>',
    name: 'image',
    category: 'Links & Media',
    code: '<img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=60&auto=format&fit=crop&q=80" alt="Sample Display Art" style="width: 50px; height: 50px; border-radius: 4px; object-fit: cover;" />',
    browserView: null,
    explanation: 'Defines an image in the document.'
  },
  {
    tag: '<input>',
    name: 'input field',
    category: 'Forms & Input',
    code: '<input type="text" placeholder="Type here..." style="padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 11px;" />',
    browserView: null,
    explanation: 'Defines an input control, allowing users to enter data.'
  },
  {
    tag: '<li>',
    name: 'list item',
    category: 'Lists',
    code: '<ul style="list-style-type: square; padding-left: 15px; font-size: 12px;">\n  <li>Item 1</li>\n</ul>',
    browserView: null,
    explanation: 'Defines a list item. Nested inside ordered (<ol>) or unordered (<ul>) lists.'
  },
  {
    tag: '<link>',
    name: 'link',
    category: 'Structure',
    code: '<link rel="stylesheet" href="style.css" />',
    browserView: '<div style="font-size: 11px; color: #64748b; font-style: italic;">Loads stylesheets or external resources. No direct visual output.</div>',
    explanation: 'Defines the relationship between a document and an external resource.'
  },
  {
    tag: '<marquee>',
    name: 'scrolling text',
    category: 'Text Formatting',
    code: '<marquee style="color: #0284c7; font-weight: 600; font-size: 12px;" scrollamount="2">Scrolling Text</marquee>',
    browserView: null,
    explanation: 'Used to insert scrolling text. Deprecated in modern HTML.'
  },
  {
    tag: '<menu>',
    name: 'menu',
    category: 'Lists',
    code: '<menu style="list-style-type: circle; padding-left: 15px; font-size: 12px;">\n  <li>Dashboard</li>\n</menu>',
    browserView: null,
    explanation: 'Defines a semantic list/menu of commands or items.'
  },
  {
    tag: '<meta>',
    name: 'meta',
    category: 'Structure',
    code: '<meta name="keywords" content="React, CSS" />',
    browserView: '<div style="font-size: 11px; color: #64748b; font-style: italic;">Defines page meta attributes. No visible output.</div>',
    explanation: 'Defines metadata about an HTML document.'
  },
  {
    tag: '<ol>',
    name: 'ordered list',
    category: 'Lists',
    code: '<ol style="list-style-type: decimal; padding-left: 15px; font-size: 12px;">\n  <li>Step 1</li>\n  <li>Step 2</li>\n</ol>',
    browserView: null,
    explanation: 'Defines an ordered (numbered) list.'
  },
  {
    tag: '<option>',
    name: 'listbox option',
    category: 'Forms & Input',
    code: '<select style="padding: 4px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 11px;">\n  <option>Option 1</option>\n  <option>Option 2</option>\n</select>',
    browserView: null,
    explanation: 'Defines an option in a drop-down list.'
  },
  {
    tag: '<p>',
    name: 'paragraph',
    category: 'Text Formatting',
    code: '<p style="color: #475569; font-size: 12px; margin: 0;">This is paragraph text.</p>',
    browserView: null,
    explanation: 'Defines a paragraph of text.'
  },
  {
    tag: '<small>',
    name: 'small (text)',
    category: 'Text Formatting',
    code: 'Normal. <small style="color: #64748b;">Small text</small>',
    browserView: null,
    explanation: 'Defines smaller text, often used for side comments and small print.'
  },
  {
    tag: '<strike>',
    name: 'deleted text',
    category: 'Text Formatting',
    code: 'Price: <strike style="color: #ef4444;">$99</strike> <b>$49</b>',
    browserView: null,
    explanation: 'Defines strikethrough/deleted text.'
  },
  {
    tag: '<strong>',
    name: 'strong emphasis',
    category: 'Text Formatting',
    code: 'This is <strong>strong</strong> text.',
    browserView: null,
    explanation: 'Defines text with strong importance (renders bold).'
  },
  {
    tag: '<table>',
    name: 'table',
    category: 'Tables',
    code: '<table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #e2e8f0;">\n  <thead>\n    <tr style="background: #f1f5f9; border-bottom: 1px solid #e2e8f0;">\n      <th style="padding: 4px; text-align: left;">Col 1</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td style="padding: 4px;">Data</td>\n    </tr>\n  </tbody>\n</table>',
    browserView: null,
    explanation: 'Defines a table layout.'
  },
  {
    tag: '<td>',
    name: 'table data',
    category: 'Tables',
    code: '<table style="font-size: 11px;">\n  <tr><td style="padding: 4px; background: #ecfdf5; color: #065f46;">Approved</td></tr>\n</table>',
    browserView: null,
    explanation: 'Defines a cell in a table.'
  },
  {
    tag: '<th>',
    name: 'table header',
    category: 'Tables',
    code: '<table style="font-size: 11px;">\n  <tr><th style="padding: 4px; background: #0f172a; color: white;">Status</th></tr>\n</table>',
    browserView: null,
    explanation: 'Defines a header cell in a table.'
  },
  {
    tag: '<title>',
    name: 'document title',
    category: 'Structure',
    code: '<title>Dashboard - PeopleWorks</title>',
    browserView: '<div style="font-size: 11px; color: #64748b; font-style: italic;">Renders inside browser tabs. No inline output.</div>',
    explanation: 'Defines a title for the document.'
  },
  {
    tag: '<tr>',
    name: 'table row',
    category: 'Tables',
    code: '<table style="font-size: 11px; width: 100%;">\n  <tr style="background-color: #f8fafc;"><td style="padding: 4px;">Row 1</td></tr>\n</table>',
    browserView: null,
    explanation: 'Defines a row in a table.'
  },
  {
    tag: '<tt>',
    name: 'teletype',
    category: 'Text Formatting',
    code: '<code style="font-family: monospace; background: #f1f5f9; padding: 2px 4px; border-radius: 4px;">Teletype</code>',
    browserView: null,
    explanation: 'Defines teletype (monospaced) text. Replaced by modern code/kbd/samp tags.'
  },
  {
    tag: '<u>',
    name: 'underline',
    category: 'Text Formatting',
    code: 'This is <u>underlined</u> text.',
    browserView: null,
    explanation: 'Defines text that should be stylistically different from normal text (underlined).'
  },
  {
    tag: '<ul>',
    name: 'unordered list',
    category: 'Lists',
    code: '<ul style="list-style-type: disc; padding-left: 15px; font-size: 12px;">\n  <li>Bullet 1</li>\n  <li>Bullet 2</li>\n</ul>',
    browserView: null,
    explanation: 'Defines an unordered (bulleted) list.'
  }
];

const HtmlShowcase = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('chart'); // 'chart' | 'datepicker'
  
  // Date Picker States (Tab 2)
  const [isOpen, _setIsOpen] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('This Month');
  const [startDate, setStartDate] = useState('2026-07-01');
  const [endDate, setEndDate] = useState('2026-07-31');
  const [selectedElement, setSelectedElement] = useState('dropdown-container');

  // Chart States (Tab 1)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeSandboxTag, setActiveSandboxTag] = useState(htmlTagsData[1]); // Default to anchor tag
  const [sandboxCode, setSandboxCode] = useState(htmlTagsData[1].code);

  const categories = ['All', 'Structure', 'Text Formatting', 'Lists', 'Forms & Input', 'Tables', 'Links & Media'];

  const filteredTags = htmlTagsData.filter(item => {
    const matchesSearch = item.tag.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.explanation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const selectSandboxTag = (tagItem) => {
    setActiveSandboxTag(tagItem);
    setSandboxCode(tagItem.code);
  };

  // Date picker details database
  const elementDetails = {
    'dropdown-trigger': {
      tag: '<button>',
      placement: 'Inline-Flex Container (Relative positioned)',
      desc: 'Triggers the popover. Styled with a border, custom padding, rounded corners, and flex layout to align the calendar icon, date text, and arrow.',
      code: `<button className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white rounded-lg text-slate-700 text-sm font-semibold shadow-sm hover:bg-slate-50 transition-all">
  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">...</svg>
  <span>Jul 01, 2026 - Jul 31, 2026</span>
  <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">...</svg>
</button>`
    },
    'dropdown-container': {
      tag: '<div>',
      placement: 'Block / Position Absolute (z-index overlay)',
      desc: 'The main popup card container. Positioned absolutely below the trigger, styled with background-white, rounded borders, and a large soft shadow for the overlay effect.',
      code: `<div className="absolute top-12 right-0 w-[420px] bg-white rounded-2xl p-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-slate-100/80 z-50">
  {/* Content */}
</div>`
    },
    'title-header': {
      tag: '<h2> & <svg>',
      placement: 'Block Level Header with Inline Icon',
      desc: 'Displays the section title. Uses uppercase styling, smaller text tracking, and muted colors for sub-headers matching modern UI kits.',
      code: `<h2 className="flex items-center gap-2 text-slate-400 font-extrabold text-[11px] uppercase tracking-wider mb-4">
  <span>📅</span>
  Select Timeframe
</h2>`
    },
    'timeframe-btn': {
      tag: '<button>',
      placement: 'Inline-Block (Flex child)',
      desc: 'Timeframe quick buttons. Configured with focus borders and active states. Red/green highlights indicate the selected state.',
      code: `<button className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-sm font-semibold transition-all">
  This Month
</button>`
    },
    'date-label': {
      tag: '<label>',
      placement: 'Block level text helper',
      desc: 'Provides descriptive labels for input text fields. Formatted in uppercase bold text for professional clarity.',
      code: `<label className="block text-slate-800 font-extrabold text-[11px] uppercase tracking-wider mb-2">
  Start Date
</label>`
    },
    'date-input': {
      tag: '<input type="date">',
      placement: 'Inline-Block Form Input',
      desc: 'Browser-native date selection input field. Customized with input padding, slate borders, custom placeholder colors, and hover transitions.',
      code: `<input 
  type="date" 
  value="2026-07-01" 
  className="w-full px-4 py-3 border border-slate-100 bg-slate-50/50 rounded-xl text-sm text-slate-800 font-semibold focus:outline-none" 
/>`
    },
    'action-cancel': {
      tag: '<button>',
      placement: 'Inline-Block (Text style)',
      desc: 'Closes the modal without applying values. Styled as a plain text button to signify a secondary/neutral option.',
      code: `<button className="text-slate-500 hover:text-slate-700 text-sm font-bold bg-transparent">
  Cancel
</button>`
    },
    'action-apply': {
      tag: '<button>',
      placement: 'Inline-Block (Solid Call-to-Action)',
      desc: 'Applies selection and submits search filter. Styled with a solid, vibrant red-orange color scheme to draw immediate user attention.',
      code: `<button className="px-6 py-2.5 bg-[#ef4444] hover:bg-[#dc2626] text-white rounded-full text-sm font-bold transition-all shadow-md">
  Apply Filter
</button>`
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-10 transition-colors duration-300">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>📚</span> PeopleWorks HTML Tag Directory & Sandbox
          </h1>
          <p className="text-slate-400 mt-2 text-sm max-w-2xl">
            Explore standard HTML markup elements, execute sandbox code samples live in the browser, or inspect how semantic tags build interactive layouts.
          </p>
        </div>
        <button 
          onClick={onBack}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-sm transition-all shadow-md cursor-pointer border border-slate-800 flex items-center gap-2"
        >
          &larr; Back to Login / Main View
        </button>
      </div>

      {/* Tabs Selector */}
      <div className="max-w-7xl mx-auto mb-8 flex border-b border-slate-800 gap-6">
        <button 
          onClick={() => setActiveTab('chart')}
          className={`pb-4 text-base font-bold transition-all cursor-pointer relative ${activeTab === 'chart' ? 'text-blue-500' : 'text-slate-400 hover:text-slate-200'}`}
        >
          📋 HTML Tags reference chart (PDF)
          {activeTab === 'chart' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
        </button>
        <button 
          onClick={() => setActiveTab('datepicker')}
          className={`pb-4 text-base font-bold transition-all cursor-pointer relative ${activeTab === 'datepicker' ? 'text-blue-500' : 'text-slate-400 hover:text-slate-200'}`}
        >
          🛠️ Interactive UI Tag Inspector
          {activeTab === 'datepicker' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
        </button>
      </div>

      {activeTab === 'chart' ? (
        /* TAB 1: HTML TAGS REFERENCE CHART & LIVE SANDBOX */
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          {/* Search and Filters */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <input 
              type="text" 
              placeholder="Search tags, names, descriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:max-w-md bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl text-sm outline-none focus:border-blue-500 text-slate-100 placeholder:text-slate-500"
            />
            {/* Category pills */}
            <div className="flex flex-wrap gap-1.5 justify-end">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    selectedCategory === cat 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* LEFT COLUMN: THE CHART TABLE INCLUDING BROWSER VIEW (EXACTLY AS PDF CHART) */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-850/80 text-xs font-bold text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                      <th className="p-4 w-28">Tag</th>
                      <th className="p-4 w-36">Name</th>
                      <th className="p-4">Code Example</th>
                      <th className="p-4 w-64">Browser View</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {filteredTags.map((item) => (
                      <tr 
                        key={item.tag}
                        onClick={() => selectSandboxTag(item)}
                        className={`hover:bg-slate-800/40 cursor-pointer transition-colors duration-150 ${activeSandboxTag.tag === item.tag ? 'bg-blue-950/15' : ''}`}
                      >
                        {/* Tag */}
                        <td className="p-4 align-top">
                          <code className="px-2.5 py-1 bg-blue-950/50 border border-blue-900/30 text-blue-400 rounded-md font-mono text-sm font-bold">
                            {item.tag}
                          </code>
                        </td>

                        {/* Name */}
                        <td className="p-4 align-top">
                          <div className="text-sm font-semibold text-slate-200 capitalize leading-tight">{item.name}</div>
                          <span className="mt-1.5 inline-block px-1.5 py-0.5 bg-slate-800 text-[9px] font-bold text-slate-400 rounded">
                            {item.category}
                          </span>
                        </td>

                        {/* Code Example */}
                        <td className="p-4 align-top font-mono text-xs text-slate-350">
                          <pre className="bg-slate-950 border border-slate-850 p-3 rounded-lg overflow-x-auto leading-relaxed max-w-[280px] sm:max-w-xs md:max-w-sm">
                            {item.code}
                          </pre>
                        </td>

                        {/* Browser View (Directly inside table row) */}
                        <td className="p-4 align-top">
                          <div className="bg-white text-slate-900 p-3.5 rounded-lg border border-slate-200 text-sm overflow-auto min-h-[60px] flex items-center justify-center max-w-[240px]">
                            {item.browserView !== null ? (
                              <div className="w-full" dangerouslySetInnerHTML={{ __html: item.browserView }} />
                            ) : (
                              <div className="w-full" dangerouslySetInnerHTML={{ __html: item.code }} />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredTags.length === 0 && (
                      <tr>
                        <td colSpan="4" className="p-8 text-center text-slate-500 text-sm font-medium">
                          No tags found matching your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RIGHT COLUMN: INTERACTIVE SANDBOX */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
                
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    ⚡ Sandbox Live Editor
                  </h3>
                  <span className="px-2 py-0.5 bg-blue-950 text-blue-400 border border-blue-900/50 rounded text-xs font-bold font-mono">
                    {activeSandboxTag.tag}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Edit HTML Code</label>
                  <textarea
                    value={sandboxCode}
                    onChange={(e) => setSandboxCode(e.target.value)}
                    className="w-full h-32 bg-slate-950 border border-slate-850 p-3 rounded-lg text-slate-200 font-mono text-xs focus:border-blue-500 outline-none resize-none leading-relaxed shadow-inner"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sandbox Preview</label>
                  <div className="w-full min-h-[100px] bg-white text-slate-900 rounded-lg p-4 border border-slate-200 overflow-auto text-sm">
                    {activeSandboxTag.browserView !== null ? (
                      <div dangerouslySetInnerHTML={{ __html: activeSandboxTag.browserView }} />
                    ) : (
                      <div dangerouslySetInnerHTML={{ __html: sandboxCode }} />
                    )}
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-slate-850 p-3 rounded-lg">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</h4>
                  <p className="text-slate-350 text-[11px] mt-1 leading-relaxed">
                    {activeSandboxTag.explanation}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* TAB 2: ORIGINAL INTERACTIVE DATEPICKER UI INSPECTOR */
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: LIVE DEMO VISUALIZATION */}
          <div className="lg:col-span-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[500px] relative">
            <span className="absolute top-4 left-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Live Component Preview</span>
            
            <div className="relative w-full max-w-[420px]">
              {/* Trigger Button */}
              <div 
                className={`flex justify-end mb-4 cursor-pointer transition-all ${selectedElement === 'dropdown-trigger' ? 'ring-2 ring-blue-500 rounded-lg p-0.5' : ''}`}
                onClick={() => setSelectedElement('dropdown-trigger')}
              >
                <div className="flex items-center gap-2.5 px-4 py-2 border border-slate-200 bg-white text-slate-700 text-sm font-semibold shadow-sm">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-slate-800 font-semibold">Jul 01, 2026 - Jul 31, 2026</span>
                  <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>

              {/* Datepicker Popover Panel */}
              {isOpen && (
                <div 
                  className={`w-full bg-white rounded-3xl p-6 shadow-[0_15px_45px_-10px_rgba(0,0,0,0.12)] border border-slate-100 flex flex-col gap-6 cursor-pointer transition-all ${selectedElement === 'dropdown-container' ? 'ring-4 ring-blue-500' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedElement('dropdown-container');
                  }}
                >
                  {/* Header title */}
                  <div 
                    className={`hover:bg-slate-50 rounded p-1 transition-all ${selectedElement === 'title-header' ? 'bg-blue-50 ring-2 ring-blue-400' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedElement('title-header');
                    }}
                  >
                    <h2 className="flex items-center gap-2 text-slate-400 font-extrabold text-[11px] uppercase tracking-wider">
                      <span>📅</span>
                      Select Timeframe
                    </h2>
                  </div>

                  {/* Timeframe Chips row */}
                  <div className="flex flex-wrap gap-2.5">
                    {['Today', 'Last 7 Days', 'This Month', 'Last 3 Months', 'Custom'].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTimeframe(item);
                          setSelectedElement('timeframe-btn');
                        }}
                        className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                          selectedTimeframe === item 
                            ? 'bg-red-50 text-red-500 font-bold border border-red-100/50' 
                            : 'bg-slate-50/80 hover:bg-slate-100 text-slate-500'
                        } ${selectedElement === 'timeframe-btn' ? 'ring-2 ring-blue-500' : ''}`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>

                  {/* Start Date / End Date Inputs */}
                  <div className="grid grid-cols-2 gap-4">
                    <div 
                      className={`p-1.5 rounded transition-all ${selectedElement === 'date-label' || selectedElement === 'date-input' ? 'bg-blue-50/50 ring-1 ring-blue-300' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElement('date-input');
                      }}
                    >
                      <label className="block text-slate-800 font-extrabold text-[11px] uppercase tracking-wider mb-2">
                        Start Date
                      </label>
                      <div className="relative flex items-center">
                        <input 
                          type="text" 
                          readOnly
                          value={startDate} 
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full px-4 py-3 border border-slate-100 bg-slate-50/50 rounded-xl text-sm text-slate-800 font-semibold focus:outline-none" 
                        />
                        <span className="absolute right-3.5 text-slate-600">📅</span>
                      </div>
                    </div>

                    <div 
                      className={`p-1.5 rounded transition-all ${selectedElement === 'date-label' || selectedElement === 'date-input' ? 'bg-blue-50/50 ring-1 ring-blue-300' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElement('date-input');
                      }}
                    >
                      <label className="block text-slate-800 font-extrabold text-[11px] uppercase tracking-wider mb-2">
                        End Date
                      </label>
                      <div className="relative flex items-center">
                        <input 
                          type="text" 
                          readOnly
                          value={endDate} 
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full px-4 py-3 border border-slate-100 bg-slate-50/50 rounded-xl text-sm text-slate-800 font-semibold focus:outline-none" 
                        />
                        <span className="absolute right-3.5 text-slate-600">📅</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-2">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElement('action-cancel');
                      }}
                      className={`text-slate-500 hover:text-slate-700 text-sm font-bold bg-transparent cursor-pointer p-2 transition-all ${selectedElement === 'action-cancel' ? 'ring-2 ring-blue-500 rounded' : ''}`}
                    >
                      Cancel
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElement('action-apply');
                      }}
                      className={`px-6 py-2.5 bg-[#ef4444] hover:bg-[#dc2626] text-white rounded-full text-sm font-bold transition-all shadow-md cursor-pointer ${selectedElement === 'action-apply' ? 'ring-4 ring-blue-400' : ''}`}
                    >
                      Apply Filter
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: DOM ELEMENT INSPECT DETAILS */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            {elementDetails[selectedElement] ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
                
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    🔎 Tag Inspector details
                  </h3>
                  <code className="px-2.5 py-1 bg-blue-950 text-blue-400 border border-blue-900/50 rounded-lg text-xs font-bold font-mono">
                    {elementDetails[selectedElement].tag}
                  </code>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Layout Placement</span>
                  <div className="text-sm font-semibold text-slate-200">
                    {elementDetails[selectedElement].placement}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">CSS Styling Rationale</span>
                  <p className="text-slate-350 text-xs sm:text-sm leading-relaxed">
                    {elementDetails[selectedElement].desc}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">HTML Code Snippet</span>
                  <pre className="bg-slate-950 border border-slate-850 p-4 rounded-xl text-slate-300 font-mono text-xs overflow-x-auto leading-relaxed max-h-48">
                    {elementDetails[selectedElement].code}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 font-medium">
                Click on any component element in the live preview to inspect its HTML tags!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HtmlShowcase;

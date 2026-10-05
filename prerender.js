import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pkg from 'js-beautify'
const { html: beautifyHtml } = pkg

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const toAbsolute = (p) => path.resolve(__dirname, p)

async function prerender() {
  try {
    const templatePath = toAbsolute('dist/index.html')
    const template = fs.readFileSync(templatePath, 'utf-8')
    
    // Import the compiled SSR entry
    const { render } = await import('./dist/server/entry-server.js')
    
    // Render the app to an HTML string
    const { html } = render()
    
    // Inject the rendered HTML into the template
    const htmlWithApp = template.replace(
      '<div id="root"></div>',
      `<div id="root">${html}</div>`
    )

    // Beautify the final HTML so View Page Source is clean and readable
    const prettyHtml = beautifyHtml(htmlWithApp, {
      indent_size: 2,
      indent_char: ' ',
      max_preserve_newlines: 1,
      preserve_newlines: true,
      wrap_line_length: 120,
      end_with_newline: true,
      indent_inner_html: true,
      extra_liners: ['head', 'body', '/html'],
    })
    
    // Write the beautified HTML file to dist/index.html
    fs.writeFileSync(templatePath, prettyHtml)
    console.log('✅ Pre-rendering successful! Beautified HTML saved to dist/index.html')
  } catch (err) {
    console.error('❌ Pre-rendering failed:', err)
    process.exit(1)
  }
}

prerender()

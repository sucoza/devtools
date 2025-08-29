import { StressTestConfig } from '../types'

interface ParsedRequest {
  method: string
  url: string
  headers: Record<string, string>
  body?: string
}

export class RequestImportParser {
  /**
   * Parse cURL command into request configuration
   */
  static parseCurl(curlCommand: string): StressTestConfig | null {
    try {
      const trimmed = curlCommand.trim()
      
      // Basic cURL command validation
      if (!trimmed.startsWith('curl')) {
        throw new Error('Not a valid cURL command')
      }
      
      const parsed = this.parseCurlCommand(trimmed)
      
      // Extract path from URL
      const urlObj = new URL(parsed.url)
      const path = urlObj.pathname + urlObj.search
      
      // Generate name from URL
      const name = this.generateNameFromUrl(parsed.url)
      
      return {
        name,
        method: parsed.method as any,
        path,
        inputParams: parsed.body ? this.tryParseJson(parsed.body) : {},
        test: 'response !== undefined',
        headers: parsed.headers
      }
    } catch (error) {
      console.error('Failed to parse cURL:', error)
      return null
    }
  }
  
  /**
   * Parse fetch() code (from network tab "Copy as fetch")
   */
  static parseFetch(fetchCode: string): StressTestConfig | null {
    try {
      // Extract fetch parameters using regex
      const fetchMatch = fetchCode.match(/fetch\s*\(\s*["'`]([^"'`]+)["'`]\s*,\s*({[^}]*})\s*\)/)
      if (!fetchMatch) {
        throw new Error('Not a valid fetch command')
      }
      
      const url = fetchMatch[1]
      const optionsStr = fetchMatch[2]
      
      // Parse the options object
      const options = this.parseFetchOptions(optionsStr)
      
      const urlObj = new URL(url, window.location.origin)
      const path = urlObj.pathname + urlObj.search
      const name = this.generateNameFromUrl(url)
      
      return {
        name,
        method: (options.method || 'GET') as any,
        path,
        inputParams: options.body ? this.tryParseJson(options.body) : {},
        test: 'response !== undefined',
        headers: options.headers || {}
      }
    } catch (error) {
      console.error('Failed to parse fetch:', error)
      return null
    }
  }
  
  /**
   * Parse PowerShell Invoke-RestMethod command
   */
  static parsePowerShell(psCommand: string): StressTestConfig | null {
    try {
      const trimmed = psCommand.trim()
      
      if (!trimmed.includes('Invoke-RestMethod') && !trimmed.includes('Invoke-WebRequest')) {
        throw new Error('Not a valid PowerShell web request command')
      }
      
      // Extract URL
      const urlMatch = trimmed.match(/-Uri\s+["']([^"']+)["']/)
      if (!urlMatch) {
        throw new Error('No URI found in PowerShell command')
      }
      
      const url = urlMatch[1]
      const urlObj = new URL(url, window.location.origin)
      const path = urlObj.pathname + urlObj.search
      
      // Extract method
      const methodMatch = trimmed.match(/-Method\s+["']?([^"'\s]+)["']?/)
      const method = methodMatch ? methodMatch[1].toUpperCase() : 'GET'
      
      // Extract headers
      const headers: Record<string, string> = {}
      const headerMatches = trimmed.matchAll(/-Headers\s+@{([^}]+)}/g)
      for (const match of headerMatches) {
        const headerStr = match[1]
        const headerPairs = headerStr.split(';')
        for (const pair of headerPairs) {
          const [key, value] = pair.split('=').map(s => s.trim().replace(/["']/g, ''))
          if (key && value) {
            headers[key] = value
          }
        }
      }
      
      // Extract body
      const bodyMatch = trimmed.match(/-Body\s+["']([^"']+)["']/)
      const body = bodyMatch ? bodyMatch[1] : undefined
      
      const name = this.generateNameFromUrl(url)
      
      return {
        name,
        method: method as any,
        path,
        inputParams: body ? this.tryParseJson(body) : {},
        test: 'response !== undefined',
        headers
      }
    } catch (error) {
      console.error('Failed to parse PowerShell:', error)
      return null
    }
  }
  
  /**
   * Auto-detect format and parse accordingly
   */
  static parseAny(input: string): StressTestConfig | null {
    const trimmed = input.trim()
    
    // Try cURL first
    if (trimmed.startsWith('curl')) {
      return this.parseCurl(trimmed)
    }
    
    // Try fetch
    if (trimmed.includes('fetch(')) {
      return this.parseFetch(trimmed)
    }
    
    // Try PowerShell
    if (trimmed.includes('Invoke-RestMethod') || trimmed.includes('Invoke-WebRequest')) {
      return this.parsePowerShell(trimmed)
    }
    
    // Try as raw HTTP request
    if (trimmed.match(/^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+/)) {
      return this.parseHttpRequest(trimmed)
    }
    
    return null
  }
  
  private static parseCurlCommand(curlCommand: string): ParsedRequest {
    const args = this.parseCurlArgs(curlCommand)
    
    let method = 'GET'
    let url = ''
    const headers: Record<string, string> = {}
    let body: string | undefined
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i]
      
      if (arg === '-X' || arg === '--request') {
        method = args[++i]?.toUpperCase() || 'GET'
      } else if (arg === '-H' || arg === '--header') {
        const header = args[++i]
        if (header) {
          const [key, ...valueParts] = header.split(':')
          if (key && valueParts.length) {
            headers[key.trim()] = valueParts.join(':').trim()
          }
        }
      } else if (arg === '-d' || arg === '--data' || arg === '--data-raw') {
        body = args[++i]
        if (method === 'GET') method = 'POST' // cURL defaults to POST when data is provided
      } else if (arg === '--url') {
        url = args[++i] || ''
      } else if (!arg.startsWith('-') && !url) {
        url = arg
      }
    }
    
    return { method, url, headers, body }
  }
  
  private static parseCurlArgs(curlCommand: string): string[] {
    const args: string[] = []
    let current = ''
    let inQuotes = false
    let quoteChar = ''
    let escaped = false
    
    for (let i = 0; i < curlCommand.length; i++) {
      const char = curlCommand[i]
      
      if (escaped) {
        current += char
        escaped = false
        continue
      }
      
      if (char === '\\') {
        escaped = true
        continue
      }
      
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true
        quoteChar = char
        continue
      }
      
      if (char === quoteChar && inQuotes) {
        inQuotes = false
        quoteChar = ''
        continue
      }
      
      if (char === ' ' && !inQuotes) {
        if (current.trim()) {
          args.push(current.trim())
          current = ''
        }
        continue
      }
      
      current += char
    }
    
    if (current.trim()) {
      args.push(current.trim())
    }
    
    return args
  }
  
  private static parseFetchOptions(optionsStr: string): any {
    try {
      // Simple regex-based parsing for common fetch options
      const options: any = {}
      
      // Extract method
      const methodMatch = optionsStr.match(/["']method["']\s*:\s*["']([^"']+)["']/)
      if (methodMatch) {
        options.method = methodMatch[1]
      }
      
      // Extract headers
      const headersMatch = optionsStr.match(/["']headers["']\s*:\s*({[^}]+})/)
      if (headersMatch) {
        try {
          // Simple header parsing
          const headersStr = headersMatch[1]
          const headers: Record<string, string> = {}
          const headerMatches = headersStr.matchAll(/["']([^"']+)["']\s*:\s*["']([^"']+)["']/g)
          for (const match of headerMatches) {
            headers[match[1]] = match[2]
          }
          options.headers = headers
        } catch (e) {
          // Ignore header parsing errors
        }
      }
      
      // Extract body
      const bodyMatch = optionsStr.match(/["']body["']\s*:\s*["']([^"']+)["']/)
      if (bodyMatch) {
        options.body = bodyMatch[1]
      }
      
      return options
    } catch (error) {
      return {}
    }
  }
  
  private static parseHttpRequest(httpRequest: string): StressTestConfig | null {
    try {
      const lines = httpRequest.split('\n')
      const firstLine = lines[0].trim()
      
      const [method, path] = firstLine.split(' ')
      if (!method || !path) {
        throw new Error('Invalid HTTP request format')
      }
      
      const headers: Record<string, string> = {}
      let bodyStartIndex = -1
      
      // Parse headers
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) {
          bodyStartIndex = i + 1
          break
        }
        
        const colonIndex = line.indexOf(':')
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim()
          const value = line.substring(colonIndex + 1).trim()
          headers[key] = value
        }
      }
      
      // Parse body
      let body = ''
      if (bodyStartIndex >= 0) {
        body = lines.slice(bodyStartIndex).join('\n').trim()
      }
      
      const name = `${method} ${path.split('?')[0]}`
      
      return {
        name,
        method: method.toUpperCase() as any,
        path,
        inputParams: body ? this.tryParseJson(body) : {},
        test: 'response !== undefined',
        headers
      }
    } catch (error) {
      console.error('Failed to parse HTTP request:', error)
      return null
    }
  }
  
  private static tryParseJson(str: string): any {
    try {
      return JSON.parse(str)
    } catch {
      return str
    }
  }
  
  private static generateNameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url, window.location.origin)
      const pathSegments = urlObj.pathname.split('/').filter(Boolean)
      const lastSegment = pathSegments[pathSegments.length - 1] || 'root'
      return `${lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1)} Request`
    } catch {
      return 'Imported Request'
    }
  }
}
/**
 * Parses CHANGELOG.md markdown into structured data
 * Converts markdown format to structured TypeScript objects
 */

export interface ChangelogEntry {
  version: string;
  date?: string;
  added?: string[];
  changed?: string[];
  deprecated?: string[];
  removed?: string[];
  fixed?: string[];
  security?: string[];
  links?: Record<string, string>;
}

export interface ChangelogData {
  title: string;
  description?: string;
  entries: ChangelogEntry[];
  unreleased?: Omit<ChangelogEntry, 'version' | 'date'>;
}

/**
 * Parse CHANGELOG.md markdown into structured data
 */
export function parseChangelog(markdown: string): ChangelogData {
  const lines = markdown.split('\n');
  const result: ChangelogData = {
    title: 'Changelog',
    entries: [],
  };

  let currentEntry: Partial<ChangelogEntry> | null = null;
  let currentSection: keyof ChangelogEntry | null = null;
  let inLinks = false;
  let foundFirstVersion = false;
  const links: Record<string, string> = {};
  const descriptionLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines (but preserve them in description)
    if (!line && !foundFirstVersion) {
      continue;
    }
    if (!line) {
      continue;
    }

    // Check for links section (at the end of file)
    if (line.startsWith('[') && line.includes(']:')) {
      inLinks = true;
      const match = line.match(/^\[([^\]]+)\]:\s*(.+)$/);
      if (match) {
        links[match[1]] = match[2];
      }
      continue;
    }

    if (inLinks) {
      const match = line.match(/^\[([^\]]+)\]:\s*(.+)$/);
      if (match) {
        links[match[1]] = match[2];
      }
      continue;
    }

    // Title (# Changelog)
    if (line.startsWith('# ')) {
      result.title = line.replace(/^#\s+/, '');
      continue;
    }

    // Version header formats:
    // - release-please format: ## [0.2.0](URL) (2025-12-03)
    // - Keep a Changelog format: ## [0.1.0] - 2024-12-03
    // - With description: ## [0.1.0] - 2024-12-03 Initial Release
    const releasePleaseFormat = line.match(/^##\s+\[([^\]]+)\]\([^)]+\)\s+\((\d{4}-\d{2}-\d{2})\)/);
    const keepChangelogFormat = line.match(/^##\s+\[([^\]]+)\](?:\s*-\s*(.+))?$/);

    const versionMatch = releasePleaseFormat || keepChangelogFormat;
    if (versionMatch) {
      foundFirstVersion = true;
      // Collect description lines before first version
      if (descriptionLines.length > 0) {
        result.description = descriptionLines.join(' ');
      }

      // Save previous entry
      if (currentEntry) {
        if (currentEntry.version === 'Unreleased') {
          result.unreleased = {
            ...currentEntry,
          } as Omit<ChangelogEntry, 'version' | 'date'>;
        } else {
          result.entries.push(currentEntry as ChangelogEntry);
        }
      }

      let version: string;
      let date: string | undefined;
      let compareUrl: string | undefined;

      if (releasePleaseFormat) {
        // release-please format: ## [0.2.0](URL) (2025-12-03)
        version = releasePleaseFormat[1];
        date = releasePleaseFormat[2];
        // Extract URL from the line
        const urlMatch = line.match(/\]\(([^)]+)\)/);
        if (urlMatch) {
          compareUrl = urlMatch[1];
        }
      } else if (keepChangelogFormat) {
        // Keep a Changelog format: ## [0.1.0] - 2024-12-03
        version = keepChangelogFormat[1];
        const datePart = keepChangelogFormat[2]?.trim() || '';

        // Extract date from datePart (supports: "2024-12-01" or "2024-12-01 Some Text")
        if (datePart) {
          // Check if it starts with a date (YYYY-MM-DD format)
          const dateMatch = datePart.match(/^(\d{4}-\d{2}-\d{2})/);
          if (dateMatch) {
            date = dateMatch[1];
          } else {
            // If it doesn't look like a date, use it as-is (might be text description)
            date = datePart;
          }
        }
      } else {
        continue; // Should not happen, but safety check
      }

      if (version === 'Unreleased') {
        currentEntry = {
          version: 'Unreleased',
        };
      } else {
        currentEntry = {
          version,
          date: date || undefined,
        };
        if (compareUrl) {
          currentEntry.links = { compare: compareUrl };
        }
      }
      currentSection = null;
      continue;
    }

    // Before first version, collect description lines
    if (!foundFirstVersion) {
      descriptionLines.push(line);
      continue;
    }

    // Section headers: ### Added, ### Fixed, etc.
    // Also handle release-please format: Features, Bug Fixes, Chores
    const sectionMatch = line.match(/^###\s+(.+)$/);
    if (sectionMatch) {
      const sectionName = sectionMatch[1].trim();

      // Map release-please section names to standard changelog sections
      const sectionMapping: Record<string, keyof ChangelogEntry> = {
        added: 'added',
        features: 'added', // release-please uses "Features"
        changed: 'changed',
        deprecated: 'deprecated',
        removed: 'removed',
        fixed: 'fixed',
        'bug fixes': 'fixed', // release-please uses "Bug Fixes"
        security: 'security',
        chores: 'added', // Map "Chores" to added for now (or we could add a chores field)
        chore: 'added',
      };

      const normalizedSection = sectionName.toLowerCase();
      const mappedSection = sectionMapping[normalizedSection];

      if (mappedSection) {
        currentSection = mappedSection;
        if (currentEntry && !currentEntry[currentSection]) {
          (currentEntry as any)[currentSection] = [];
        }
      }
      continue;
    }

    // List items: - Item text or * Item text (release-please uses *)
    const listMatch = line.match(/^[-*]\s+(.+)$/);
    if (listMatch && currentEntry && currentSection) {
      let item = listMatch[1].trim();
      // Remove commit links like ([29bc917](URL)) from the end
      item = item.replace(/\s+\(\[[^\]]+\]\([^)]+\)\)\s*$/, '');
      const items = (currentEntry[currentSection] as string[]) || [];
      items.push(item);
      (currentEntry as any)[currentSection] = items;
      continue;
    }
  }

  // Save last entry
  if (currentEntry) {
    if (currentEntry.version === 'Unreleased') {
      result.unreleased = {
        ...currentEntry,
      } as Omit<ChangelogEntry, 'version' | 'date'>;
    } else {
      result.entries.push(currentEntry as ChangelogEntry);
    }
  }

  // Add links to entries
  result.entries.forEach((entry) => {
    if (links[entry.version]) {
      entry.links = { compare: links[entry.version] };
    }
  });

  if (result.unreleased && links['Unreleased']) {
    if (!result.unreleased.links) {
      result.unreleased.links = {};
    }
    result.unreleased.links.compare = links['Unreleased'];
  }

  return result;
}

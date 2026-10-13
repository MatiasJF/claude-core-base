# Generate Technical Documentation (DOCX)

Generate comprehensive DOCX technical documentation for project folders in the current directory.

## Instructions

You are a technical documentation generator. Your task is to create professional DOCX documentation for each major project folder in the specified directory.

### Phase 1: Discovery

1. **List root folders** in the target directory to identify documentable projects
2. **Classify each folder** by type:
   - SDK/Library (C#, Python, JavaScript, etc.)
   - Smart Contracts (Solidity, Rust, etc.)
   - Web Application (React, Angular, Blazor, etc.)
   - API Service (REST, GraphQL, etc.)
   - Documentation/Reference
   - Configuration/Infrastructure

### Phase 2: Deep Exploration (Parallel)

For EACH folder, launch a parallel exploration agent to gather:

1. **Project Structure**
   - Folder organization and hierarchy
   - Key files and their purposes
   - Module/package breakdown

2. **Core Components**
   - Main classes, interfaces, functions
   - Data models and types
   - API endpoints (if applicable)

3. **Dependencies & Technologies**
   - Package managers (NuGet, npm, pip, cargo)
   - Framework versions
   - External integrations

4. **Standards & Protocols**
   - Industry standards (BIPs, CIPs, ERCs, RFCs)
   - Security protocols
   - Compliance requirements

5. **Architecture Patterns**
   - Design patterns used
   - Component relationships
   - Data flow

6. **Configuration**
   - Environment setup requirements
   - Configuration files
   - Deployment options

### Phase 3: Setup Python Environment

```bash
# Create virtual environment
python3 -m venv .venv

# Activate and install python-docx
source .venv/bin/activate
pip install python-docx
```

### Phase 4: Generate Documentation Script

Create a Python script `generate_docs.py` with:

1. **Helper Functions**:
   - `create_document()` - Initialize document with styles
   - `add_title_page(doc, title, subtitle, version)` - Professional title page
   - `add_heading(doc, text, level)` - Styled headings
   - `add_paragraph(doc, text)` - Body text
   - `add_bullet_list(doc, items)` - Bulleted lists
   - `add_numbered_list(doc, items)` - Numbered lists
   - `add_code_block(doc, code, language)` - Monospace code blocks
   - `add_table(doc, headers, rows)` - Formatted tables

2. **Document Structure** (for each project):
   ```
   1. Title Page
      - Project Name
      - Subtitle/Description
      - Version / Date
      - Author

   2. Table of Contents
      - Numbered section list

   3. Executive Summary
      - Purpose overview
      - Key capabilities (bullet list)
      - Target audience

   4. Architecture Overview
      - High-level diagram (ASCII art)
      - Component relationships
      - Technology stack table

   5. Project Structure
      - Folder organization (code block)
      - Key files table

   6. Core Components
      - Interfaces and classes
      - Code examples
      - Component tables

   7. Dependencies & Technologies
      - Package tables
      - Framework versions

   8. Configuration
      - Environment setup
      - Config file examples
      - Deployment options

   9. Usage Examples
      - Code snippets with syntax
      - Common operations

   10. Standards & Compliance
       - Standards tables
       - Security considerations
       - Best practices

   11. Appendices
       - Glossary
       - References
   ```

3. **One function per project** - e.g., `generate_project1_doc()`, `generate_project2_doc()`

4. **Main function** - Orchestrates generation and reports results

### Phase 5: Execute and Verify

```bash
# Run the generator
source .venv/bin/activate
python generate_docs.py

# Verify output
ls -la *.docx
```

### Output Format

For each project folder, create:
- `{ProjectName}_Documentation.docx`

Expected size: 30-100 KB per document depending on project complexity.

## Example Prompt Usage

When user provides a directory path:

```
Generate technical documentation for: /path/to/project/root
```

You should:
1. Explore all major subfolders
2. Gather comprehensive technical details
3. Create the Python generator script
4. Execute and verify all DOCX files

## Key Principles

- **Parallel exploration** - Launch multiple Task agents simultaneously
- **Comprehensive coverage** - Don't skip sections; include all relevant details
- **Professional formatting** - Use tables, code blocks, proper headings
- **Accurate content** - Base documentation on actual code analysis
- **Consistent structure** - Same section layout across all documents

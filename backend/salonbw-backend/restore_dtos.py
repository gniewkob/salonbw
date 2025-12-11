
import json
import os
import re

TSC_OUTPUT_FILE = "tsc_output.txt"
OPENAPI_FILE = "openapi.json"

def to_camel_case(snake_str):
    components = snake_str.split('-')
    return components[0] + ''.join(x.title() for x in components[1:])

def to_pascal_case(snake_str):
    components = snake_str.split('-')
    return ''.join(x.title() for x in components)

def get_class_name(file_name):
    # e.g. create-appointment.dto -> CreateAppointmentDto
    base = file_name.replace('.dto', '')
    return to_pascal_case(base) + 'Dto'

def restore_dtos():
    with open(TSC_OUTPUT_FILE, 'r') as f:
        tsc_lines = f.readlines()

    with open(OPENAPI_FILE, 'r') as f:
        openapi = json.load(f)
    
    schemas = openapi.get('components', {}).get('schemas', {})
    
    missing_modules = set()
    # Parse lines like: src/appointments/appointments.controller.ts(31,38): error TS2307: Cannot find module './dto/create-appointment.dto'
    
    for line in tsc_lines:
        match = re.search(r"src/(.*?): error TS2307: Cannot find module '\./dto/(.*?)'", line)
        if match:
            rel_path = match.group(0).split(':')[0] # src/appointments/appointments.controller.ts
            dto_name = match.group(2) # create-appointment.dto
            
            # Construct full path
            # src/appointments/appointments.controller.ts -> src/appointments/dto/create-appointment.dto.ts
            dir_path = os.path.dirname(rel_path)
            dto_path = os.path.join(dir_path, 'dto', dto_name + '.ts')
            
            missing_modules.add(dto_path)

    print(f"Found {len(missing_modules)} missing DTO files to restore.")

    for file_path in missing_modules:
        file_name = os.path.basename(file_path).replace('.ts', '') # create-appointment.dto
        class_name = get_class_name(file_name)
        
        # Try to find schema
        schema = schemas.get(class_name)
        
        # Special case aliases or try to guess without Dto suffix if generic
        if not schema:
            # e.g. formulas/dto/formula.dto -> Formula
            if class_name.endswith('Dto'):
                alt_name = class_name[:-3] # Remove Dto
                if alt_name in schemas:
                    schema = schemas[alt_name]
                    class_name = alt_name # Use schema name logic? No, keep Dto class name but use schema props
        
        print(f"Restoring {file_path} (Class: {class_name})... Schema found: {bool(schema)}")
        
        # Ensure dir exists
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        content = generate_ts_content(class_name, schema)
        
        with open(file_path, 'w') as f:
            f.write(content)

def generate_ts_content(class_name, schema):
    lines = []
    lines.append("import { ApiProperty } from '@nestjs/swagger';")
    lines.append("import { IsString, IsNumber, IsBoolean, IsOptional, IsNotEmpty, IsDateString, IsArray, ValidateNested } from 'class-validator';")
    lines.append("import { Type } from 'class-transformer';")
    lines.append("")
    lines.append(f"export class {class_name} {{")
    
    if schema and 'properties' in schema:
        required_fields = schema.get('required', [])
        
        for prop_name, prop_def in schema['properties'].items():
            ts_type = 'any'
            decorators = []
            
            # Type mapping
            p_type = prop_def.get('type')
            if p_type == 'string':
                ts_type = 'string'
                decorators.append("@IsString()")
                if prop_def.get('format') == 'date-time':
                    decorators.append("@IsDateString()")
            elif p_type == 'number' or p_type == 'integer':
                ts_type = 'number'
                decorators.append("@IsNumber()")
            elif p_type == 'boolean':
                ts_type = 'boolean'
                decorators.append("@IsBoolean()")
            elif p_type == 'array':
                ts_type = 'any[]' # Simplified
                decorators.append("@IsArray()")
            
            # Nullable/Optional
            is_required = prop_name in required_fields
            nullable = prop_def.get('nullable', False)
            
            if not is_required or nullable:
                decorators.append("@IsOptional()")
            else:
                decorators.append("@IsNotEmpty()")
            
            # ApiProperty
            description = prop_def.get('description', '')
            example = prop_def.get('example')
            api_prop_opts = []
            if description:
                api_prop_opts.append(f"description: '{description}'")
            if example is not None:
                if isinstance(example, str):
                    api_prop_opts.append(f"example: '{example}'")
                else:
                    api_prop_opts.append(f"example: {example}")
            if not is_required:
                api_prop_opts.append("required: false")
                
            decorators.append(f"@ApiProperty({{ {', '.join(api_prop_opts)} }})")
            
            # Write decorators
            for dec in decorators:
                lines.append(f"    {dec}")
            
            # Write property
            suffix = "?" if (not is_required or nullable) else ""
            lines.append(f"    {prop_name}{suffix}: {ts_type};")
            lines.append("")
            
    else:
        # Fallback for empty schema or missing DTO
        lines.append("    // TODO: Properties could not be restored from OpenAPI")
        lines.append("    [key: string]: any;") 
        
    lines.append("}")
    return "\n".join(lines)

if __name__ == "__main__":
    restore_dtos()

/**
 * Minimal, dependency-free JSON Schema validator.
 *
 * Supports the subset used by the Invitation schemas:
 *   type, const, enum, required, properties, additionalProperties,
 *   items, minItems, maxItems, uniqueItems, minLength, pattern, format,
 *   minimum, minProperties.
 *
 * `format` is validated only for "date-time" and "uri" (both loosely, so that
 * valid documents are never rejected on formatting niceties).
 */
export function validate(schema, data, path = "$", errors = []) {
  if (schema === undefined || schema === null) return errors;

  if (Array.isArray(schema.type)) {
    const matches = schema.type.some((t) => matchesType(t, data));
    if (!matches) {
      errors.push(`${path}: expected one of types [${schema.type.join(", ")}]`);
      return errors;
    }
  } else if (typeof schema.type === "string" && !matchesType(schema.type, data)) {
    errors.push(`${path}: expected type ${schema.type}`);
    return errors;
  }

  if ("const" in schema && data !== schema.const) {
    errors.push(`${path}: expected const ${JSON.stringify(schema.const)}`);
  }

  if (Array.isArray(schema.enum)) {
    const ok = schema.enum.some((v) => v === data);
    if (!ok) errors.push(`${path}: value ${JSON.stringify(data)} not in enum`);
  }

  if (typeof data === "number") {
    if (typeof schema.minimum === "number" && data < schema.minimum) {
      errors.push(`${path}: ${data} < minimum ${schema.minimum}`);
    }
    if (typeof schema.maximum === "number" && data > schema.maximum) {
      errors.push(`${path}: ${data} > maximum ${schema.maximum}`);
    }
  }

  if (typeof data === "string") {
    if (typeof schema.minLength === "number" && data.length < schema.minLength) {
      errors.push(`${path}: string shorter than minLength ${schema.minLength}`);
    }
    if (typeof schema.pattern === "string" && !new RegExp(schema.pattern).test(data)) {
      errors.push(`${path}: string does not match pattern ${schema.pattern}`);
    }
    if (schema.format === "date-time" && Number.isNaN(Date.parse(data))) {
      errors.push(`${path}: not a valid date-time`);
    }
    if (schema.format === "uri" && !/^[a-z][a-z0-9+.-]*:/i.test(data)) {
      errors.push(`${path}: not a valid URI`);
    }
  }

  if (Array.isArray(data)) {
    if (typeof schema.minItems === "number" && data.length < schema.minItems) {
      errors.push(`${path}: fewer than minItems ${schema.minItems}`);
    }
    if (typeof schema.maxItems === "number" && data.length > schema.maxItems) {
      errors.push(`${path}: more than maxItems ${schema.maxItems}`);
    }
    if (schema.uniqueItems === true) {
      const seen = new Set();
      data.forEach((item, i) => {
        const key = JSON.stringify(item);
        if (seen.has(key)) errors.push(`${path}[${i}]: duplicate item`);
        seen.add(key);
      });
    }
    if (schema.items) {
      data.forEach((item, i) => validate(schema.items, item, `${path}[${i}]`, errors));
    }
  }

  if (data && typeof data === "object" && !Array.isArray(data)) {
    const props = schema.properties ?? {};
    if (Array.isArray(schema.required)) {
      for (const key of schema.required) {
        if (!(key in data)) errors.push(`${path}: missing required property "${key}"`);
      }
    }
    if (typeof schema.minProperties === "number") {
      if (Object.keys(data).length < schema.minProperties) {
        errors.push(`${path}: fewer than minProperties ${schema.minProperties}`);
      }
    }
    for (const [key, value] of Object.entries(data)) {
      if (key in props) {
        validate(props[key], value, `${path}.${key}`, errors);
      } else if (schema.additionalProperties === false) {
        errors.push(`${path}: unexpected property "${key}"`);
      }
    }
  }

  return errors;
}

function matchesType(type, data) {
  switch (type) {
    case "object":
      return data !== null && typeof data === "object" && !Array.isArray(data);
    case "array":
      return Array.isArray(data);
    case "string":
      return typeof data === "string";
    case "integer":
      return typeof data === "number" && Number.isInteger(data);
    case "number":
      return typeof data === "number";
    case "boolean":
      return typeof data === "boolean";
    case "null":
      return data === null;
    default:
      return true;
  }
}

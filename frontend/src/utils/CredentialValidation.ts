// import Ajv from "ajv";

// const ajv = new Ajv({
//   allErrors: true,
//   strict: false,
// });

// type ValidationResult =
//   | { isValid: true }
//   | { isValid: false; error: string };

// const UNSUPPORTED_SCHEMA_KEYS = new Set([
//   "issuerKey",
//   "issuerDid",
//   "issuerDID",
//   "issuerKeyDid",
//   "credentialIssuer",
//   "display",
//   "mapping",
// ]);

// function stripUnsupportedKeywords(value: unknown): unknown {
//   if (Array.isArray(value)) {
//     return value.map(stripUnsupportedKeywords);
//   }

//   if (value !== null && typeof value === "object") {
//     const cleaned: Record<string, unknown> = {};

//     for (const [key, childValue] of Object.entries(
//       value as Record<string, unknown>
//     )) {
//       if (UNSUPPORTED_SCHEMA_KEYS.has(key)) {
//         continue;
//       }

//       cleaned[key] = stripUnsupportedKeywords(childValue);
//     }

//     return cleaned;
//   }

//   return value;
// }

// export function validateCredentialAgainstSchema(
//   credential: Record<string, unknown>,
//   schema: object
// ): ValidationResult {
//   try {
//     const cleanedSchema = stripUnsupportedKeywords(schema);
//     const validate = ajv.compile(cleanedSchema);
//     const valid = validate(credential);

//     if (valid) {
//       return { isValid: true };
//     }

//     const firstError = validate.errors?.[0];

//     if (!firstError) {
//       return {
//         isValid: false,
//         error: "Credential data failed schema validation.",
//       };
//     }

//     return {
//       isValid: false,
//       error: `${firstError.instancePath || "credential"} ${firstError.message}`,
//     };
//   } catch (error) {
//     console.error("Schema validation failed:", error);

//     return {
//       isValid: false,
//       error: "Credential schema could not be processed.",
//     };
//   }
// }
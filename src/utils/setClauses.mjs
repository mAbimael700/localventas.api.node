export const setClause = (updatedFields) =>
  Object.keys(updatedFields)
    .map((field) => `${field} = ?`)
    .join(", ");

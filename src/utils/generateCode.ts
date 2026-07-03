export const generateCode = (parentId?: number) => {
  const base = parentId ? parentId * 1000 : 1000;
  return String(base + Math.floor(Math.random() * 900));
};

// src/utils/csv.ts
export function downloadCSV(objArray: any[], filename = "export.csv") {
    if (!objArray || !objArray.length) {
        alert("No rows to export");
        return;
    }
    const keys = Object.keys(objArray[0]);
    const lines = [keys.join(",")];
    for (const row of objArray) {
        lines.push(keys.map((k) => {
            const cell = row[k] ?? "";
            const safe = String(cell).replace(/"/g, '""');
            return `"${safe}"`;
        }).join(","));
    }
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

"""
Fill file Excel "Main Report" tu du lieu QA ticket do backend tra ve.

THAY DOI so voi ban truoc: KHONG dung 63 dong loi co dinh trong template nua.
- Dong 1-26 (header + dong tieu de bang "OK | Major | Minor | Remarks"): GIU NGUYEN 100% tu template, khong dong vao.
- Tu dong 27: xoa toan bo noi dung cu, sinh moi hoan toan - moi defect.name
  KHAC NHAU ma BE tra ve se thanh 1 dong, khong phu thuoc danh muc co dinh
  nao trong file mau.

Cach dung:
    python fill_qa_report.py \
        --template ./BB_PREFINAL_FINAL_template.xlsx \
        --tickets ./tickets.json \
        --output ./output/report_filled.xlsx

`tickets.json` la MOT MANG cac ticket object dung format BE tra ve (hoac 1
object don le). Nhieu ticket se duoc GOP LAI: cung defect.id -> cong don so
luong vao 1 dong duy nhat.

LUU Y:
- Khong co field 'severity' (Major/Minor) trong response BE hien tai, nen
  cot Major/Minor rieng biet KHONG the tach tu dong. Script hien dang ghi
  tong so luong vao cot "Qty" gop chung (xem cot G). Neu sau nay BE tra ve
  them severity cho tung defect, sua ham `aggregate_defects()` va
  `write_defect_rows()` de tach lai 2 cot Major/Minor nhu file mau goc.
- Vi so dong la dong (thay doi theo tung lan chay), cong thuc SUM o dong
  "Total" duoc TU SINH lai theo dung vi tri dong thuc te (khong con
  hardcode H27:H89 nhu file goc), nen van la formula that, khong phai so
  cung.
"""

import argparse
import json
from collections import OrderedDict
from copy import copy

import openpyxl

SHEET_NAME = "Main Report (2)"
FIRST_DEFECT_ROW = 27          # dong dau tien cua bang loi, ngay sau header dong 26
LAST_DEFECT_ROW = 89           # dong cuoi cung TRUOC dong "Total" (90) - KHONG duoc vuot qua
HEADER_ROW = 26                # dong tieu de OK/Major/Minor/Remarks - lay style tu day


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def aggregate_defects(tickets):
    """defect_id -> {"name": str, "qty": int, "notes": [str]}"""
    agg = OrderedDict()
    for ticket in tickets:
        for d in ticket.get("defects", []):
            defect_id = str(d["defect"]["id"])
            name = d["defect"]["name"]
            qty = sum(loc.get("quantity", 0) for loc in d.get("locations", []))

            if defect_id not in agg:
                agg[defect_id] = {"name": name, "qty": 0, "notes": []}
            agg[defect_id]["qty"] += qty
            if d.get("note"):
                agg[defect_id]["notes"].append(d["note"])
    return agg


def clear_old_defect_rows(ws, start_row=FIRST_DEFECT_ROW, end_row=LAST_DEFECT_ROW):
    """Xoa sach 63 dong loi co dinh cu (CHI trong khoang 27-89). KHONG duoc
    dong tay vao dong 90 tro xuong - do la vung Total/AQL/Ket qua co cong
    thuc tham chieu cheo sang sheet khac, xoa nham se lam vo cac sheet do."""
    for merged_range in list(ws.merged_cells.ranges):
        if start_row <= merged_range.min_row <= end_row:
            ws.unmerge_cells(str(merged_range))

    for row in range(start_row, end_row + 1):
        for col in range(1, 14):  # A..M
            ws.cell(row=row, column=col).value = None


def write_defect_rows(ws, aggregated):
    """Ghi moi dong TRONG PHAM VI 27-89 (khong duoc vuot qua LAST_DEFECT_ROW,
    vi dong 90 tro di la vung Total/AQL co san, phai giu nguyen).
    A = ten loi (tu BE), I = so luong (cot Minor - xem ghi chu ve severity
    ben duoi), J = remarks/note. Cot H (Major) de trong.

    VE SEVERITY: response BE hien khong co field phan loai Major/Minor cho
    tung defect, nen script mac dinh dua het vao cot Minor (I) va chen kem
    dong chu canh bao vao Remarks. Cong thuc Total (dong 90: SUM H27:H89 /
    SUM I27:I89) va bang AQL Pass/Fail phia duoi VAN CHAY BINH THUONG vi no
    tham chieu ca khoang 27-89 co san - chi la ket qua Major se luon = 0
    cho toi khi co du lieu severity that."""
    template_cells = {
        col: copy(ws.cell(row=HEADER_ROW, column=col)._style)
        for col in range(1, 14)
    }

    row = FIRST_DEFECT_ROW
    overflow = []
    for defect_id, data in aggregated.items():
        if row > LAST_DEFECT_ROW:
            overflow.append(data["name"])
            continue

        ws.cell(row=row, column=1, value=data["name"])   # A: ten loi (tu BE)
        ws.cell(row=row, column=9, value=data["qty"])     # I: so luong (Minor - mac dinh)

        remark = "; ".join(data["notes"]) if data["notes"] else ""
        remark = (remark + " " if remark else "") + "[CHUA XAC DINH MAJOR/MINOR - BE chua tra severity]"
        ws.cell(row=row, column=10, value=remark.strip())  # J: remarks

        for col in range(1, 14):
            ws.cell(row=row, column=col)._style = template_cells[col]

        row += 1

    if overflow:
        print(f"[CANH BAO] {len(overflow)} defect vuot qua {LAST_DEFECT_ROW - FIRST_DEFECT_ROW + 1} dong cho phep, KHONG duoc ghi: {overflow}")

    return row - 1


def fill_report(template_path, tickets_path, output_path):
    tickets = load_json(tickets_path)
    if isinstance(tickets, dict):
        tickets = [tickets]

    wb = openpyxl.load_workbook(template_path, data_only=False)
    ws = wb[SHEET_NAME]

    # Dong 1-26: KHONG DONG VAO, giu nguyen tu template.

    clear_old_defect_rows(ws)
    aggregated = aggregate_defects(tickets)
    last_defect_row = write_defect_rows(ws, aggregated)

    wb.save(output_path)
    print(f"Da luu: {output_path}")
    print(f"Bang loi: dong {FIRST_DEFECT_ROW} -> {last_defect_row} (Total co san o dong 90 giu nguyen)")
    print("Nho chay recalc (LibreOffice) de cong thuc SUM/AQL tinh gia tri.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--template", required=True)
    parser.add_argument("--tickets", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    fill_report(args.template, args.tickets, args.output)
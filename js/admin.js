/**
 * Panel admin — consume la API REST de /api/guests.
 * Charts con Chart.js, exportación con SheetJS (xlsx) y jsPDF + autotable.
 */
(function () {
  "use strict";

  const API_BASE = "/api";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  const STATUS_LABEL = { confirmed: "Confirmado", pending: "Pendiente", declined: "No asistirá" };

  let guests = [];
  let knownIds = new Set();
  let pieChart, barChart;

  /* ============================================================
     Navegación entre vistas
     ============================================================ */
  $$(".nav-link[data-view]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      $$(".nav-link[data-view]").forEach((l) => l.classList.remove("active"));
      link.classList.add("active");
      $$(".view").forEach((v) => v.classList.remove("active"));
      $("#view-" + link.dataset.view).classList.add("active");
    });
  });

  /* ============================================================
     Fetch de datos
     ============================================================ */
  async function fetchGuests() {
    try {
      const res = await fetch(`${API_BASE}/guests`);
      const data = await res.json();

      // Detectar nuevos registros para notificación en vivo
      if (knownIds.size > 0) {
        data.forEach((g) => {
          if (!knownIds.has(g.id)) {
            showToast(`Nuevo registro: ${g.firstName} ${g.lastName}`);
          }
        });
      }
      knownIds = new Set(data.map((g) => g.id));

      guests = data;
      renderAll();
    } catch (err) {
      showToast("No se pudo conectar con la API. ¿Está corriendo el servidor?");
    }
  }

  function renderAll() {
    renderStats();
    renderCharts();
    renderRecent();
    renderTable();
  }

  /* ============================================================
     Estadísticas
     ============================================================ */
  function renderStats() {
    const total = guests.length;
    const confirmed = guests.filter((g) => g.status === "confirmed");
    const pending = guests.filter((g) => g.status === "pending");
    const declined = guests.filter((g) => g.status === "declined");
    const rate = total === 0 ? 0 : Math.round((confirmed.length / total) * 100);

    $("#statTotal").textContent = total;
    $("#statConfirmed").textContent = confirmed.length;
    $("#statPending").textContent = pending.length;
    $("#statDeclined").textContent = declined.length;
    $("#statRate").textContent = rate + "%";
  }

  /* ============================================================
     Gráficas
     ============================================================ */
  function renderCharts() {
    if (typeof Chart === "undefined") return;

    const confirmed = guests.filter((g) => g.status === "confirmed").length;
    const pending = guests.filter((g) => g.status === "pending").length;
    const declined = guests.filter((g) => g.status === "declined").length;

    const pieCtx = $("#pieChart");
    if (pieChart) pieChart.destroy();
    pieChart = new Chart(pieCtx, {
      type: "doughnut",
      data: {
        labels: ["Confirmados", "Pendientes", "No asistirán"],
        datasets: [{
          data: [confirmed, pending, declined],
          backgroundColor: ["#8FDCB2", "#F3CE8B", "#F4A7B9"],
          borderWidth: 0
        }]
      },
      options: {
        plugins: { legend: { position: "bottom", labels: { boxWidth: 12, font: { family: "Jost" } } } },
        cutout: "62%"
      }
    });

    // Barras: asistentes confirmados agrupados por cantidad de acompañantes
    const buckets = {};
    guests.filter((g) => g.status === "confirmed").forEach((g) => {
      const k = String(g.attendees || 1);
      buckets[k] = (buckets[k] || 0) + 1;
    });
    const labels = Object.keys(buckets).sort();

    const barCtx = $("#barChart");
    if (barChart) barChart.destroy();
    barChart = new Chart(barCtx, {
      type: "bar",
      data: {
        labels: labels.map((l) => l + (l === "1" ? " persona" : " personas")),
        datasets: [{
          label: "Grupos",
          data: labels.map((l) => buckets[l]),
          backgroundColor: "#FFB3A0",
          borderRadius: 8,
          maxBarThickness: 46
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  /* ============================================================
     Últimos registros
     ============================================================ */
  function renderRecent() {
    const list = $("#recentList");
    const recent = [...guests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);
    list.innerHTML = recent.length
      ? recent.map((g) => `
        <div class="recent-item">
          <div>
            <div class="who">${escapeHtml(g.firstName)} ${escapeHtml(g.lastName)}</div>
            <div class="when">${formatDate(g.createdAt)}</div>
          </div>
          <span class="badge ${g.status}">${STATUS_LABEL[g.status]}</span>
        </div>`).join("")
      : `<p style="color:var(--a-ink-soft); font-size:13.5px;">Aún no hay registros.</p>`;
  }

  /* ============================================================
     Tabla — búsqueda, filtro, orden
     ============================================================ */
  function getFilteredSorted() {
    const q = $("#searchInput").value.trim().toLowerCase();
    const status = $("#statusFilter").value;
    const sort = $("#sortSelect").value;

    let list = guests.filter((g) => {
      const matchesQ = !q || `${g.firstName} ${g.lastName} ${g.phone}`.toLowerCase().includes(q);
      const matchesStatus = !status || g.status === status;
      return matchesQ && matchesStatus;
    });

    list.sort((a, b) => {
      if (sort === "date_desc") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sort === "date_asc") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sort === "name_asc") return a.firstName.localeCompare(b.firstName);
      if (sort === "name_desc") return b.firstName.localeCompare(a.firstName);
      return 0;
    });

    return list;
  }

  function renderTable() {
    const tbody = $("#guestsTbody");
    const list = getFilteredSorted();

    $("#emptyState").style.display = list.length ? "none" : "block";

    tbody.innerHTML = list.map((g) => `
      <tr data-id="${g.id}">
        <td><strong>${escapeHtml(g.firstName)} ${escapeHtml(g.lastName)}</strong></td>
        <td>${escapeHtml(g.phone || "—")}</td>
        <td>${g.attendees}</td>
        <td>
          <select class="status-select ${g.status}" data-id="${g.id}">
            <option value="confirmed" ${g.status === "confirmed" ? "selected" : ""}>Confirmado</option>
            <option value="pending" ${g.status === "pending" ? "selected" : ""}>Pendiente</option>
            <option value="declined" ${g.status === "declined" ? "selected" : ""}>No asistirá</option>
          </select>
        </td>
        <td class="msg-cell" title="${escapeHtml(g.message || "")}">${escapeHtml(g.message || "—")}</td>
        <td>${formatDate(g.createdAt)}</td>
        <td>
          <div class="row-actions">
            <button class="edit-btn" data-id="${g.id}" title="Editar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
            </button>
            <button class="delete-btn" data-id="${g.id}" title="Eliminar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join("");

    // Colorear selects de estado según valor
    $$(".status-select", tbody).forEach((sel) => {
      applyStatusColor(sel);
      sel.addEventListener("change", async () => {
        applyStatusColor(sel);
        await patchStatus(sel.dataset.id, sel.value);
      });
    });

    $$(".edit-btn", tbody).forEach((btn) => btn.addEventListener("click", () => openEditModal(btn.dataset.id)));
    $$(".delete-btn", tbody).forEach((btn) => btn.addEventListener("click", () => deleteGuest(btn.dataset.id)));
  }

  function applyStatusColor(sel){
    const colors = {
      confirmed: { bg: "#E4F8EE", color: "#2F9E63" },
      pending: { bg: "#FFF3DC", color: "#B98625" },
      declined: { bg: "#FCE7E9", color: "#C6597A" }
    };
    const c = colors[sel.value];
    sel.style.background = c.bg;
    sel.style.color = c.color;
  }

  $("#searchInput").addEventListener("input", renderTable);
  $("#statusFilter").addEventListener("change", renderTable);
  $("#sortSelect").addEventListener("change", renderTable);

  /* ============================================================
     CRUD
     ============================================================ */
  const modal = $("#guestModal");
  const guestForm = $("#guestForm");

  $("#addGuestBtn").addEventListener("click", () => openAddModal());
  $("#modalCancel").addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

  function openAddModal() {
    $("#modalTitle").textContent = "Agregar invitado";
    guestForm.reset();
    $("#guestId").value = "";
    $("#mAttendees").value = 1;
    modal.classList.add("show");
  }

  function openEditModal(id) {
    const g = guests.find((x) => x.id === id);
    if (!g) return;
    $("#modalTitle").textContent = "Editar invitado";
    $("#guestId").value = g.id;
    $("#mFirstName").value = g.firstName;
    $("#mLastName").value = g.lastName;
    $("#mPhone").value = g.phone;
    $("#mAttendees").value = g.attendees;
    $("#mStatus").value = g.status;
    $("#mMessage").value = g.message;
    modal.classList.add("show");
  }

  function closeModal() { modal.classList.remove("show"); }

  guestForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = $("#guestId").value;
    const payload = {
      firstName: $("#mFirstName").value.trim(),
      lastName: $("#mLastName").value.trim(),
      phone: $("#mPhone").value.trim(),
      attendees: Number($("#mAttendees").value) || 1,
      status: $("#mStatus").value,
      message: $("#mMessage").value.trim()
    };

    try {
      if (id) {
        await fetch(`${API_BASE}/guests/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        showToast("Invitado actualizado");
      } else {
        await fetch(`${API_BASE}/guests`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        showToast("Invitado agregado");
      }
      closeModal();
      fetchGuests();
    } catch (err) {
      showToast("Error al guardar. Verifica que la API esté corriendo.");
    }
  });

  async function deleteGuest(id) {
    if (!confirm("¿Eliminar este invitado? Esta acción no se puede deshacer.")) return;
    try {
      await fetch(`${API_BASE}/guests/${id}`, { method: "DELETE" });
      showToast("Invitado eliminado");
      fetchGuests();
    } catch (err) {
      showToast("Error al eliminar");
    }
  }

  async function patchStatus(id, status) {
    try {
      await fetch(`${API_BASE}/guests/${id}/confirm`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      showToast("Estado actualizado");
      fetchGuests();
    } catch (err) {
      showToast("Error al actualizar el estado");
    }
  }

  /* ============================================================
     Exportaciones
     ============================================================ */
  function exportRows() {
    return getFilteredSorted().map((g) => ({
      Nombre: g.firstName,
      Apellido: g.lastName,
      Telefono: g.phone,
      Asistentes: g.attendees,
      Estado: STATUS_LABEL[g.status],
      Mensaje: g.message,
      Registrado: formatDate(g.createdAt)
    }));
  }

  $("#exportCsv").addEventListener("click", () => {
    const rows = exportRows();
    if (!rows.length) return showToast("No hay datos para exportar");
    const header = Object.keys(rows[0]);
    const csv = [
      header.join(","),
      ...rows.map((r) => header.map((h) => `"${String(r[h]).replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    downloadBlob(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }), "invitados-nashly-antonella.csv");
  });

  $("#exportXlsx").addEventListener("click", () => {
    if (typeof XLSX === "undefined") return showToast("Librería de Excel no disponible");
    const rows = exportRows();
    if (!rows.length) return showToast("No hay datos para exportar");
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invitados");
    XLSX.writeFile(wb, "invitados-nashly-antonella.xlsx");
  });

  $("#exportPdf").addEventListener("click", () => {
    if (typeof window.jspdf === "undefined") return showToast("Librería de PDF no disponible");
    const rows = exportRows();
    if (!rows.length) return showToast("No hay datos para exportar");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(16);
    doc.text("Baby Shower de Nashly Antonella — Invitados", 14, 18);
    doc.autoTable({
      startY: 26,
      head: [Object.keys(rows[0])],
      body: rows.map((r) => Object.values(r)),
      styles: { font: "helvetica", fontSize: 9 },
      headStyles: { fillColor: [255, 179, 160] }
    });
    doc.save("invitados-nashly-antonella.pdf");
  });

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ============================================================
     Utilidades
     ============================================================ */
  function formatDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" }) +
      " · " + d.toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" });
  }

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, (m) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[m]));
  }

  let toastTimer;
  function showToast(msg) {
    const toast = $("#toast");
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
  }

  /* ============================================================
     Mesa de Regalos (Admin)
     ============================================================ */
  let gifts = [];
  const adminGiftModal = $("#adminGiftModal");
  const adminGiftForm = $("#adminGiftForm");
  const addGiftBtn = $("#addGiftBtn");
  const adminGiftCancel = $("#adminGiftCancel");
  const giftsTbody = $("#giftsTbody");
  const giftsEmptyState = $("#giftsEmptyState");

  if (addGiftBtn) {
    addGiftBtn.addEventListener("click", () => {
      $("#gName").value = "";
      if ($("#gUnlimited")) $("#gUnlimited").checked = false;
      adminGiftModal.classList.add("show");
    });
  }

  if (adminGiftCancel) {
    adminGiftCancel.addEventListener("click", () => {
      adminGiftModal.classList.remove("show");
      if ($("#gUnlimited")) $("#gUnlimited").checked = false;
    });
  }

  if (adminGiftForm) {
    adminGiftForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = $("#gName").value.trim();
      const unlimited = $("#gUnlimited") ? $("#gUnlimited").checked : false;
      if (!name) return;

      try {
        const res = await fetch(`${API_BASE}/gifts/admin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, unlimited })
        });
        if (!res.ok) throw new Error("No se pudo agregar el regalo");
        
        showToast("Regalo agregado correctamente");
        adminGiftModal.classList.remove("show");
        if ($("#gUnlimited")) $("#gUnlimited").checked = false;
        fetchGifts();
      } catch (err) {
        showToast(err.message);
      }
    });
  }

  async function fetchGifts() {
    try {
      console.log("[Mesa de Regalos] Iniciando fetch a /api/gifts...");
      const res = await fetch(`${API_BASE}/gifts`);
      console.log("[Mesa de Regalos] Respuesta HTTP de API:", res.status);
      
      if (!res.ok) {
        console.error("[Mesa de Regalos] Error HTTP devuelto por API:", res.statusText);
        return;
      }
      
      const data = await res.json();
      console.log("[Mesa de Regalos] Regalos recibidos de base de datos:", data);
      gifts = data;
      renderGiftsTable();
    } catch (err) {
      console.error("[Mesa de Regalos] Excepción capturada en fetchGifts:", err);
    }
  }

  // Hacer esta función global para poder llamarla desde el atributo onclick de los elementos generados
  window.freeGiftReservation = async function (giftId, index, name) {
    if (!confirm(`¿Seguro que deseas eliminar la reserva de "${name}"?`)) return;
    try {
      const res = await fetch(`${API_BASE}/gifts/admin/${giftId}/free`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationIndex: index })
      });
      if (!res.ok) throw new Error("No se pudo liberar la reserva");
      showToast(`Reserva de ${name} eliminada`);
      fetchGifts();
    } catch (err) {
      showToast(err.message);
    }
  };

  function renderGiftsTable() {
    console.log("[Mesa de Regalos] Elemento giftsTbody en DOM:", giftsTbody);
    if (!giftsTbody) {
      console.warn("[Mesa de Regalos] Advertencia: #giftsTbody no se encuentra en el DOM.");
      return;
    }
    
    console.log("[Mesa de Regalos] Cantidad de regalos a renderizar:", gifts.length);
    if (gifts.length === 0) {
      giftsTbody.innerHTML = "";
      giftsEmptyState.style.display = "block";
      return;
    }
    
    giftsEmptyState.style.display = "none";
    giftsTbody.innerHTML = "";

    gifts.forEach(g => {
      const tr = document.createElement("tr");

      // Nombre
      const tdName = document.createElement("td");
      tdName.innerHTML = `<strong>${escapeHtml(g.name)}</strong>`;
      tr.appendChild(tdName);

      // Estado
      const tdStatus = document.createElement("td");
      if (g.unlimited) {
        const count = g.reservations ? g.reservations.length : 0;
        if (count > 0) {
          tdStatus.innerHTML = `<span class="badge confirmed" style="background:#E8E4FC; color:#6F5FA3;">Ilimitado (${count})</span>`;
        } else {
          tdStatus.innerHTML = `<span class="badge pending" style="background:#E3F5F8; color:#3F8B9B;">Ilimitado (0)</span>`;
        }
      } else {
        if (g.reserved) {
          tdStatus.innerHTML = `<span class="badge confirmed">Reservado</span>`;
        } else {
          tdStatus.innerHTML = `<span class="badge pending">Disponible</span>`;
        }
      }
      tr.appendChild(tdStatus);

      // Reservado por
      const tdBy = document.createElement("td");
      if (g.unlimited) {
        if (g.reservations && g.reservations.length > 0) {
          const listHtml = g.reservations.map((r, idx) => {
            return `<div style="margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
              <span>• ${escapeHtml(r.reservedBy)}</span>
              <button class="btn-ghost-admin danger" style="padding: 2px 6px; font-size: 10px; border-radius: 4px; line-height: 1; display: inline-flex; align-items: center;" onclick="window.freeGiftReservation('${g.id}', ${idx}, '${escapeHtml(r.reservedBy)}')">✕</button>
            </div>`;
          }).join("");
          tdBy.innerHTML = listHtml;
        } else {
          tdBy.textContent = "—";
        }
      } else {
        tdBy.textContent = g.reserved ? g.reservedBy : "—";
      }
      tr.appendChild(tdBy);

      // Fecha Reserva
      const tdDate = document.createElement("td");
      if (g.unlimited) {
        if (g.reservations && g.reservations.length > 0) {
          tdDate.innerHTML = g.reservations.map(r => `<div style="margin-bottom: 4px;">${formatDate(r.reservedAt)}</div>`).join("");
        } else {
          tdDate.textContent = "—";
        }
      } else {
        tdDate.textContent = g.reserved ? formatDate(g.reservedAt) : "—";
      }
      tr.appendChild(tdDate);

      // Acciones
      const tdActions = document.createElement("td");
      tdActions.style.textAlign = "right";
      
      if (g.unlimited) {
        if (g.reservations && g.reservations.length > 0) {
          const btnFree = document.createElement("button");
          btnFree.className = "btn-ghost-admin";
          btnFree.style.marginRight = "6px";
          btnFree.textContent = "Liberar Todo";
          btnFree.addEventListener("click", () => freeGift(g.id));
          tdActions.appendChild(btnFree);
        }
      } else {
        if (g.reserved) {
          const btnFree = document.createElement("button");
          btnFree.className = "btn-ghost-admin";
          btnFree.style.marginRight = "6px";
          btnFree.textContent = "Liberar";
          btnFree.addEventListener("click", () => freeGift(g.id));
          tdActions.appendChild(btnFree);
        }
      }

      const btnDel = document.createElement("button");
      btnDel.className = "btn-ghost-admin danger";
      btnDel.textContent = "Eliminar";
      btnDel.addEventListener("click", () => deleteGift(g.id));
      tdActions.appendChild(btnDel);

      tr.appendChild(tdActions);
      giftsTbody.appendChild(tr);
    });
  }

  async function freeGift(id) {
    if (!confirm("¿Seguro que deseas liberar este regalo para que esté disponible de nuevo?")) return;
    try {
      const res = await fetch(`${API_BASE}/gifts/admin/${id}/free`, {
        method: "POST"
      });
      if (!res.ok) throw new Error("No se pudo liberar el regalo");
      showToast("Regalo liberado");
      fetchGifts();
    } catch (err) {
      showToast(err.message);
    }
  }

  async function deleteGift(id) {
    if (!confirm("¿Seguro que deseas eliminar este regalo de la lista?")) return;
    try {
      const res = await fetch(`${API_BASE}/gifts/admin/${id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("No se pudo eliminar el regalo");
      showToast("Regalo eliminado");
      fetchGifts();
    } catch (err) {
      showToast(err.message);
    }
  }

  /* ============================================================
     Polling en vivo
     ============================================================ */
  fetchGuests();
  fetchGifts();
  setInterval(() => {
    fetchGuests();
    fetchGifts();
  }, 8000);
})();

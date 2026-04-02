document.addEventListener('DOMContentLoaded', () => {
	const config = window.formConfig;
	if (!config) return console.error('[form.js] No formConfig defined.');

	document.title = `${capitalize(config.type)} - Projekt City`;

	const heading = document.getElementById('form-heading');
	const subtitle = document.getElementById('form-subtitle');

	if (heading) {
		heading.textContent = config.title || capitalize(config.type);
		heading.setAttribute('data-i18n', 'form_title');
	}
	if (subtitle) {
		subtitle.textContent = config.subtitle || '';
		subtitle.setAttribute('data-i18n', 'form_subtitle');
	}

	const iconEl = document.getElementById('form-icon');
	if (iconEl) iconEl.innerHTML = config.icon || '📋';

	const btnText = document.querySelector('#submit-btn .btn-text');
	if (btnText) btnText.setAttribute('data-i18n', 'btn_submit');

	renderFields(config.fields);

	// Apply translations to all data-i18n elements including the ones we just rendered
	if (window.i18n?.translatePage) window.i18n.translatePage();

	bindSubmit(config);

	// Re-translate when the user switches language
	document.addEventListener('languageChanged', () => {
		if (window.i18n?.translatePage) window.i18n.translatePage();
	});
});

function renderFields(fields) {
	const container = document.getElementById('form-fields');
	if (!container) return;

	fields.forEach(field => {
		const group = document.createElement('div');
		group.className = 'field-group';
		group.innerHTML = buildFieldHTML(field);
		container.appendChild(group);
	});
}

function buildFieldHTML(f) {
	const req = f.required ? '<span class="req" aria-hidden="true">*</span>' : '';
	const reqAttr = f.required ? 'required' : '';
	const phAttr = f.placeholder ? `placeholder="${esc(f.placeholder)}"` : '';
	const labelKey = `field_${f.name}_label`;
	const phKey = `field_${f.name}_placeholder`;

	let input = '';

	if (f.type === 'textarea') {
		input = `<textarea id="${f.name}" name="${f.name}" rows="${f.rows || 5}" ${reqAttr} ${phAttr} data-i18n-placeholder="${phKey}"></textarea>`;

	} else if (f.type === 'select') {
		const opts = (f.options || [])
			.map(o => {
				const val = typeof o === 'object' ? o.value : o;
				const label = typeof o === 'object' ? o.label : o;
				const optKey = `field_${f.name}_opt_${val}`;
				return `<option value="${esc(val)}" data-i18n="${optKey}">${esc(label)}</option>`;
			})
			.join('');
		const placeholderText = f.placeholder || 'Select...';
		input = `<select id="${f.name}" name="${f.name}" ${reqAttr}><option value="" disabled selected data-i18n="${phKey}">${esc(placeholderText)}</option>${opts}</select>`;

	} else {
		const typeAttr = f.type || 'text';
		input = `<input type="${typeAttr}" id="${f.name}" name="${f.name}" ${reqAttr} ${phAttr} autocomplete="off" data-i18n-placeholder="${phKey}" />`;
	}

	return `
    <label for="${f.name}" data-i18n="${labelKey}">${esc(f.label)}${req}</label>
    ${input}
    <span class="field-error" id="${f.name}-error" role="alert"></span>
  `;
}

function bindSubmit(config) {
	const form = document.getElementById('dynamic-form');
	const btn = document.getElementById('submit-btn');
	const status = document.getElementById('form-status');
	if (!form) return;

	form.addEventListener('submit', async (e) => {
		e.preventDefault();
		clearErrors();

		if (!validateFields(config.fields)) return;

		const fields = collectFields(config.fields);

		setLoading(btn, true);
		hideStatus(status);

		try {
			await submitToSupabase(config.type, fields);
			// Use translated success message if available, fall back to config value
			const successMsg = window.i18n?.get('form_success', config.successMessage) || config.successMessage;
			showSuccess(status, successMsg || 'Submitted successfully. Thanks!');
			form.reset();
		} catch (err) {
			console.error('[form.js] Submit error:', err);
			showError(status, 'Something went wrong. Please try again.');
		} finally {
			setLoading(btn, false);
		}
	});
}

function validateFields(fields) {
	let valid = true;

	fields.forEach(f => {
		if (!f.required) return;
		const el = document.getElementById(f.name);
		const err = document.getElementById(`${f.name}-error`);
		if (!el) return;

		const val = el.value.trim();
		if (!val) {
			if (err) err.textContent = 'This field is required.';
			el.classList.add('invalid');
			el.setAttribute('aria-invalid', 'true');
			valid = false;
		}
	});

	return valid;
}

function clearErrors() {
	document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
	document.querySelectorAll('.invalid').forEach(el => {
		el.classList.remove('invalid');
		el.removeAttribute('aria-invalid');
	});
}

function collectFields(fields) {
	const result = {};
	fields.forEach(f => {
		const el = document.getElementById(f.name);
		if (el) result[f.name] = el.value.trim();
	});
	return result;
}

function setLoading(btn, loading) {
	if (!btn) return;
	btn.disabled = loading;
	btn.setAttribute('data-loading', loading ? 'true' : 'false');
	btn.querySelector('.btn-text').style.opacity = loading ? '0' : '1';
	btn.querySelector('.btn-spinner').style.display = loading ? 'block' : 'none';
}

function showSuccess(el, msg) {
	if (!el) return;
	el.className = 'form-status success';
	el.textContent = msg;
	el.hidden = false;
}

function showError(el, msg) {
	if (!el) return;
	el.className = 'form-status error';
	el.textContent = msg;
	el.hidden = false;
}

function hideStatus(el) {
	if (!el) return;
	el.hidden = true;
	el.textContent = '';
}

function capitalize(str) {
	return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

function esc(str) {
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}
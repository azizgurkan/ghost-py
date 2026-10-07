/* ==========================================================================
   pratikye teması — aşamalı zenginleştirme katmanı
   - Tarif gövdesini pratikye düzenine çevirir (ayar paneli, iki kolon, SSS)
   - Favoriler (localStorage) ve çekmece paneli
   - Mobil menü, sabit başlık durumu, yazdırma
   JavaScript kapalıyken içerik okunabilir kalır.
   ========================================================================== */
(function () {
    'use strict';

    var FAVORITES_KEY = 'pratikye:favorites';

    /* --- yardımcılar ----------------------------------------------------- */
    function $(selector, scope) {
        return (scope || document).querySelector(selector);
    }

    function $$(selector, scope) {
        return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
    }

    function normalize(text) {
        return (text || '')
            .toLocaleLowerCase('tr')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function sectionKind(heading) {
        var text = normalize(heading.textContent);
        if (text.indexOf('malzeme') !== -1) return 'ingredients';
        if (text.indexOf('yapılış') !== -1 || text.indexOf('hazırlan') !== -1 || text.indexOf('adımlar') !== -1) return 'method';
        if (text.indexOf('cihaz ayar') !== -1) return 'settings';
        if (text.indexOf('ipucu') !== -1 || text.indexOf('püf') !== -1) return 'tip';
        if (text.indexOf('besin') !== -1) return 'nutrition';
        if (text.indexOf('sıkça sorulan') !== -1 || text.indexOf('sss') !== -1) return 'faq';
        return null;
    }

    /* --- mobil menü ------------------------------------------------------ */
    function initNav() {
        var toggle = $('[data-nav-toggle]');
        var nav = $('[data-mobile-nav]');
        if (!toggle || !nav) return;

        toggle.addEventListener('click', function () {
            var open = nav.classList.toggle('is-open');
            nav.hidden = !open;
            toggle.setAttribute('aria-expanded', String(open));
        });
    }

    /* --- sabit başlık ---------------------------------------------------- */
    function initHeaderState() {
        var header = $('[data-site-header]');
        if (!header) return;
        var onScroll = function () {
            header.classList.toggle('is-scrolled', window.scrollY > 8);
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
    }

    /* --- favoriler ------------------------------------------------------- */
    function readFavorites() {
        try {
            var raw = window.localStorage.getItem(FAVORITES_KEY);
            var list = raw ? JSON.parse(raw) : [];
            return Array.isArray(list) ? list : [];
        } catch (error) {
            return [];
        }
    }

    function writeFavorites(list) {
        try {
            window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
        } catch (error) {
            /* gizli mod vb. — sessizce yut */
        }
    }

    function isFavorite(slug) {
        return readFavorites().some(function (item) {
            return item.slug === slug;
        });
    }

    function toggleFavorite(item) {
        var list = readFavorites();
        var index = list.findIndex(function (entry) {
            return entry.slug === item.slug;
        });
        if (index === -1) {
            list.push(item);
        } else {
            list.splice(index, 1);
        }
        writeFavorites(list);
        syncFavorites();
        return index === -1;
    }

    function syncFavorites() {
        var list = readFavorites();
        var count = list.length;

        $$('[data-favorites-count]').forEach(function (badge) {
            badge.textContent = String(count);
            badge.hidden = count === 0;
        });

        $$('[data-favorite-toggle]').forEach(function (button) {
            var active = list.some(function (entry) {
                return entry.slug === button.getAttribute('data-slug');
            });
            button.setAttribute('aria-pressed', String(active));
            var label = $('[data-favorite-label]', button);
            if (label) {
                label.textContent = active ? 'Favorilerden çıkar' : 'Favorilere ekle';
            }
            var title = button.getAttribute('data-title') || 'Tarif';
            button.setAttribute(
                'aria-label',
                active ? title + ' tarifini favorilerden çıkar' : title + ' tarifini favorilere ekle'
            );
        });

        renderFavoritesDrawer(list);
    }

    function renderFavoritesDrawer(list) {
        var drawer = $('[data-favorites-drawer]');
        if (!drawer) return;
        var listEl = $('[data-favorites-list]', drawer);
        var emptyEl = $('[data-favorites-empty]', drawer);
        if (!listEl || !emptyEl) return;

        listEl.innerHTML = '';
        emptyEl.hidden = list.length > 0;

        list.forEach(function (item) {
            var li = document.createElement('li');

            var link = document.createElement('a');
            link.href = item.url;
            link.textContent = item.title;

            var remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'favorites-remove';
            remove.setAttribute('aria-label', item.title + ' tarifini favorilerden çıkar');
            remove.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
            remove.addEventListener('click', function () {
                var next = readFavorites().filter(function (entry) {
                    return entry.slug !== item.slug;
                });
                writeFavorites(next);
                syncFavorites();
            });

            li.appendChild(link);
            li.appendChild(remove);
            listEl.appendChild(li);
        });
    }

    function initFavorites() {
        $$('[data-favorite-toggle]').forEach(function (button) {
            button.addEventListener('click', function () {
                var item = {
                    slug: button.getAttribute('data-slug'),
                    title: button.getAttribute('data-title') || document.title,
                    url: button.getAttribute('data-url') || window.location.href
                };
                if (!item.slug) return;
                toggleFavorite(item);
            });
        });

        var drawer = $('[data-favorites-drawer]');
        if (drawer) {
            $$('[data-favorites-open]').forEach(function (opener) {
                opener.addEventListener('click', function () {
                    drawer.hidden = false;
                    document.body.style.overflow = 'hidden';
                    var close = $('[data-favorites-close]', drawer);
                    if (close) close.focus();
                });
            });

            var closeDrawer = function () {
                drawer.hidden = true;
                document.body.style.overflow = '';
            };

            $$('[data-favorites-close]').forEach(function (closer) {
                closer.addEventListener('click', closeDrawer);
            });

            drawer.addEventListener('click', function (event) {
                if (event.target === drawer) closeDrawer();
            });

            document.addEventListener('keydown', function (event) {
                if (event.key === 'Escape' && !drawer.hidden) closeDrawer();
            });
        }

        syncFavorites();
    }

    /* --- tarif gövdesi zenginleştirme ------------------------------------ */
    function getSectionNodes(heading) {
        var nodes = [heading];
        var node = heading.nextElementSibling;
        while (node && node.tagName !== 'H2' && node.tagName !== 'H1') {
            nodes.push(node);
            node = node.nextElementSibling;
        }
        return nodes;
    }

    function makePanel(modifier, heading, nodes) {
        var panel = document.createElement('div');
        panel.className = 'recipe-panel recipe-panel--' + modifier;
        panel.appendChild(heading);
        nodes.forEach(function (node) {
            panel.appendChild(node);
        });
        return panel;
    }

    function readRecipeJson() {
        try {
            var el = document.getElementById('pratikye-recipe');
            if (!el) return null;
            var data = JSON.parse(el.textContent || el.innerHTML || '{}');
            return data && typeof data === 'object' && !Array.isArray(data) ? data : null;
        } catch (error) {
            return null;
        }
    }

    function enhanceSettings(heading, nodes) {
        var panel = document.createElement('div');
        panel.className = 'settings-panel';

        var title = document.createElement('p');
        title.className = 'settings-panel__title';
        title.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/><path d="M12 14v-4"/><path d="M12 8h.01"/></svg>' + heading.textContent;

        var grid = document.createElement('div');
        grid.className = 'settings-panel__grid';

        var pairs = [];
        var structured = readRecipeJson();
        if (structured) {
            if (structured.program) pairs.push(['Program', structured.program]);
            if (structured.timeMinutes) pairs.push(['Süre', structured.timeMinutes + ' dakika']);
            if (structured.temperature) pairs.push(['Sıcaklık', structured.temperature]);
            if (structured.servings) pairs.push(['Porsiyon', structured.servings]);
            if (Array.isArray(structured.accessories) && structured.accessories.length) {
                pairs.push(['Aksesuar', structured.accessories.join(', ')]);
            } else if (structured.accessories) {
                pairs.push(['Aksesuar', String(structured.accessories)]);
            }
        }

        if (!pairs.length) {
            var list = null;
            nodes.forEach(function (node) {
                if (node.tagName === 'UL' || node.tagName === 'OL') list = node;
            });
            if (list) {
                $$('li', list).forEach(function (li) {
                    var text = li.textContent || '';
                    var splitAt = text.indexOf(':');
                    var label = splitAt > -1 ? text.slice(0, splitAt) : 'Ayar';
                    var value = splitAt > -1 ? text.slice(splitAt + 1) : text;
                    pairs.push([label.trim(), value.trim()]);
                });
            }
        }

        pairs.forEach(function (pair) {
            var item = document.createElement('div');
            item.className = 'settings-item';

            var labelEl = document.createElement('p');
            labelEl.className = 'settings-item__label';
            labelEl.textContent = pair[0];

            var valueEl = document.createElement('p');
            valueEl.className = 'settings-item__value';
            valueEl.textContent = pair[1];

            item.appendChild(labelEl);
            item.appendChild(valueEl);
            grid.appendChild(item);
        });

        panel.appendChild(title);
        panel.appendChild(grid);
        if (structured && structured.sourceNote) {
            var note = document.createElement('p');
            note.className = 'settings-panel__note';
            note.textContent = 'Uyarlama notu: ' + structured.sourceNote;
            panel.appendChild(note);
        }
        heading.remove();
        nodes.forEach(function (node) {
            node.remove();
        });
        return panel;
    }

    function enhanceRecipeBody() {
        var body = $('[data-recipe-body]');
        if (!body) return;

        try {
            var headings = $$('h2', body);
            var found = {};

            headings.forEach(function (heading) {
                var kind = sectionKind(heading);
                if (kind && !found[kind]) {
                    found[kind] = { heading: heading, nodes: getSectionNodes(heading) };
                }
            });

            /* Cihaz ayarları — krem panel */
            if (found.settings) {
                var settingsPanel = enhanceSettings(found.settings.heading, found.settings.nodes);
                var anchor = null;
                if (found.ingredients) {
                    anchor = found.ingredients.heading;
                } else if (found.method) {
                    anchor = found.method.heading;
                }
                if (anchor && anchor.parentNode) {
                    anchor.parentNode.insertBefore(settingsPanel, anchor);
                } else {
                    body.insertBefore(settingsPanel, body.firstChild);
                }
            }

            /* Malzemeler + Yapılış — iki kolon */
            var ingredients = found.ingredients;
            var method = found.method;
            if (ingredients || method) {
                var columns = document.createElement('div');
                columns.className = 'recipe-columns';

                var firstHeading = (ingredients || method).heading;
                firstHeading.parentNode.insertBefore(columns, firstHeading);

                if (ingredients) {
                    var ingredientsNodes = ingredients.nodes.slice(1);
                    columns.appendChild(makePanel('ingredients', ingredients.heading, ingredientsNodes));
                }
                if (method) {
                    var methodNodes = method.nodes.slice(1);
                    columns.appendChild(makePanel('method', method.heading, methodNodes));
                }
            }

            /* İpucu */
            if (found.tip) {
                var tip = document.createElement('div');
                tip.className = 'tip-box';
                found.tip.nodes[0].parentNode.insertBefore(tip, found.tip.nodes[0]);
                found.tip.nodes.forEach(function (node) {
                    tip.appendChild(node);
                });
            }

            /* Besin değerleri */
            if (found.nutrition) {
                var nutrition = document.createElement('div');
                nutrition.className = 'nutrition-box';
                found.nutrition.nodes[0].parentNode.insertBefore(nutrition, found.nutrition.nodes[0]);
                found.nutrition.nodes.forEach(function (node) {
                    nutrition.appendChild(node);
                });
            }

            /* SSS */
            if (found.faq) {
                var faq = document.createElement('div');
                faq.className = 'faq-block';
                found.faq.nodes[0].parentNode.insertBefore(faq, found.faq.nodes[0]);
                found.faq.nodes.forEach(function (node) {
                    faq.appendChild(node);
                });
            }
        } catch (error) {
            /* Zenginleştirme başarısız olursa içerik olduğu gibi kalır */
        }
    }

    /* --- küçük yardımcılar ----------------------------------------------- */
    function initStripPrefixes() {
        $$('[data-strip-prefix]').forEach(function (el) {
            var text = el.textContent || '';
            el.textContent = text.replace(/^\s*(cihaz|kategori|durum|koleksiyon)\s*:\s*/i, '');
        });
    }

    function initPrint() {
        $$('[data-print]').forEach(function (button) {
            button.addEventListener('click', function () {
                window.print();
            });
        });
    }

    /* --- başlat ---------------------------------------------------------- */
    function init() {
        initNav();
        initHeaderState();
        initFavorites();
        enhanceRecipeBody();
        initStripPrefixes();
        initPrint();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

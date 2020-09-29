
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.24.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/App.svelte generated by Svelte v3.24.1 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    // (110:32) 
    function create_if_block_1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "game screen here";
    			attr_dev(p, "class", "svelte-6a3c4j");
    			add_location(p, file, 110, 4, 2587);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(110:32) ",
    		ctx
    	});

    	return block;
    }

    // (91:2) {#if state === 'welcome'}
    function create_if_block(ctx) {
    	let p;
    	let t1;
    	let form;
    	let select0;
    	let option0;
    	let option1;
    	let option2;
    	let t5;
    	let select1;
    	let option3;
    	let option4;
    	let option5;
    	let option6;
    	let t10;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "So you think you know HTML? Prove it! Select the number of questions,\n      difficulty level and let's find out!";
    			t1 = space();
    			form = element("form");
    			select0 = element("select");
    			option0 = element("option");
    			option0.textContent = "Easy";
    			option1 = element("option");
    			option1.textContent = "Medium";
    			option2 = element("option");
    			option2.textContent = "Hard";
    			t5 = space();
    			select1 = element("select");
    			option3 = element("option");
    			option3.textContent = "5";
    			option4 = element("option");
    			option4.textContent = "10";
    			option5 = element("option");
    			option5.textContent = "15";
    			option6 = element("option");
    			option6.textContent = "20";
    			t10 = space();
    			button = element("button");
    			button.textContent = "Start Game";
    			attr_dev(p, "class", "svelte-6a3c4j");
    			add_location(p, file, 91, 4, 1921);
    			option0.__value = "Easy";
    			option0.value = option0.__value;
    			add_location(option0, file, 97, 8, 2136);
    			option1.__value = "Medium";
    			option1.value = option1.__value;
    			add_location(option1, file, 98, 8, 2179);
    			option2.__value = "Hard";
    			option2.value = option2.__value;
    			add_location(option2, file, 99, 8, 2226);
    			if (/*difficulty*/ ctx[1] === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[4].call(select0));
    			add_location(select0, file, 96, 6, 2095);
    			option3.__value = "5";
    			option3.value = option3.__value;
    			add_location(option3, file, 102, 8, 2328);
    			option4.__value = "10";
    			option4.value = option4.__value;
    			add_location(option4, file, 103, 8, 2365);
    			option5.__value = "15";
    			option5.value = option5.__value;
    			add_location(option5, file, 104, 8, 2404);
    			option6.__value = "20";
    			option6.value = option6.__value;
    			add_location(option6, file, 105, 8, 2443);
    			if (/*numOfQuestions*/ ctx[2] === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[5].call(select1));
    			add_location(select1, file, 101, 6, 2283);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "svelte-6a3c4j");
    			add_location(button, file, 107, 6, 2496);
    			add_location(form, file, 95, 4, 2057);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, form, anchor);
    			append_dev(form, select0);
    			append_dev(select0, option0);
    			append_dev(select0, option1);
    			append_dev(select0, option2);
    			select_option(select0, /*difficulty*/ ctx[1]);
    			append_dev(form, t5);
    			append_dev(form, select1);
    			append_dev(select1, option3);
    			append_dev(select1, option4);
    			append_dev(select1, option5);
    			append_dev(select1, option6);
    			select_option(select1, /*numOfQuestions*/ ctx[2]);
    			append_dev(form, t10);
    			append_dev(form, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(select0, "change", /*select0_change_handler*/ ctx[4]),
    					listen_dev(select1, "change", /*select1_change_handler*/ ctx[5]),
    					listen_dev(form, "submit", /*handleSubmit*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*difficulty*/ 2) {
    				select_option(select0, /*difficulty*/ ctx[1]);
    			}

    			if (dirty & /*numOfQuestions*/ 4) {
    				select_option(select1, /*numOfQuestions*/ ctx[2]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(form);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(91:2) {#if state === 'welcome'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let header;
    	let h1;
    	let t1;

    	function select_block_type(ctx, dirty) {
    		if (/*state*/ ctx[0] === "welcome") return create_if_block;
    		if (/*state*/ ctx[0] === "playing") return create_if_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			header = element("header");
    			h1 = element("h1");
    			h1.textContent = "PROGRAMMING TRIVIA";
    			t1 = space();
    			if (if_block) if_block.c();
    			attr_dev(h1, "class", "svelte-6a3c4j");
    			add_location(h1, file, 88, 4, 1849);
    			add_location(header, file, 87, 2, 1836);
    			attr_dev(main, "class", "svelte-6a3c4j");
    			add_location(main, file, 86, 0, 1827);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, header);
    			append_dev(header, h1);
    			append_dev(main, t1);
    			if (if_block) if_block.m(main, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(main, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);

    			if (if_block) {
    				if_block.d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const proxyURL = "https://cors-anywhere.herokuapp.com/";

    function instance($$self, $$props, $$invalidate) {
    	let state = "welcome"; // 'playing'
    	let difficulty;
    	let numOfQuestions;
    	let category;

    	// let questionsPromise;
    	let questions;

    	let score;

    	// let trivia;
    	let questionAnswers;

    	let userAnswers;

    	const api = {
    		key: {"env":{"isProd":false,"QUIZ_API_KEY":"e6lMqx1TmljfaA2D7M3W1bRRpZymDOAbos3niO0i"}}.env.QUIZ_API_KEY,
    		baseURL: "https://quizapi.io/api/v1/"
    	};

    	const loadQuestions = async () => {
    		try {
    			score = 0;
    			let response = await fetch(`${proxyURL}${api.baseURL}questions?apiKey=${api.key}&difficulty=${difficulty}&limit=${numOfQuestions}&tags=JavaScript`);
    			questions = await response.json();
    			console.log(questions);
    			getQuestions(questions);
    		} catch(err) {
    			alert(err);
    		}
    	};

    	const getQuestions = async questions => {
    		try {
    			userAnswers = [];

    			const array = await questions.forEach(question => {
    				let answersArray = question.incorrect_answers;
    				answersArray.push(question.correct_answer);
    			});
    		} catch(err) {
    			alert(err);
    		}
    	};

    	const handleSubmit = e => {
    		e.preventDefault();
    		loadQuestions();
    		console.log(difficulty, numOfQuestions);
    		$$invalidate(0, state = "playing");
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	function select0_change_handler() {
    		difficulty = select_value(this);
    		$$invalidate(1, difficulty);
    	}

    	function select1_change_handler() {
    		numOfQuestions = select_value(this);
    		$$invalidate(2, numOfQuestions);
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		state,
    		difficulty,
    		numOfQuestions,
    		category,
    		questions,
    		score,
    		questionAnswers,
    		userAnswers,
    		proxyURL,
    		api,
    		loadQuestions,
    		getQuestions,
    		handleSubmit
    	});

    	$$self.$inject_state = $$props => {
    		if ("state" in $$props) $$invalidate(0, state = $$props.state);
    		if ("difficulty" in $$props) $$invalidate(1, difficulty = $$props.difficulty);
    		if ("numOfQuestions" in $$props) $$invalidate(2, numOfQuestions = $$props.numOfQuestions);
    		if ("category" in $$props) category = $$props.category;
    		if ("questions" in $$props) questions = $$props.questions;
    		if ("score" in $$props) score = $$props.score;
    		if ("questionAnswers" in $$props) questionAnswers = $$props.questionAnswers;
    		if ("userAnswers" in $$props) userAnswers = $$props.userAnswers;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		state,
    		difficulty,
    		numOfQuestions,
    		handleSubmit,
    		select0_change_handler,
    		select1_change_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
      target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map

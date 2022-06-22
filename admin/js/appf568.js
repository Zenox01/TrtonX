var App = {
    hasInited: false
    , datepickerDateFormat: 'yyyy-mm-dd'
    , tableRowsOrder: []
    , tableRowsOrderLast: []
    , skipAjaxLoader: false
    , iCheckSettings: {checkboxClass: 'icheckbox_square-blue', radioClass: 'iradio_square-blue'}
    , iCheckSelector: 'form input[type="checkbox"]:not(.for-copy input, .switch, .regular, .slide), form input[type="radio"]:not(.for-copy input, .switch, .regular, .slide), section.panel table.table input[type="checkbox"]'
    , hiddenIframe: '<iframe src="" name="imageDataGetter" id="imageDataGetter" style="display:none; visibility: hidden"></iframe>'
    , tinyMceSettings: {
        main: {
            theme: "modern"
            , menubar: 'file edit insert view format table'
            , plugins: [
                "advlist autolink lists link image charmap print preview hr anchor pagebreak"
                    , "searchreplace wordcount visualblocks visualchars code fullscreen"
                    , "insertdatetime media nonbreaking save table contextmenu directionality"
                    , "emoticons template paste textcolor colorpicker textpattern cms_upload"
            ]
            , toolbar1: "insertfile undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent"
            , toolbar2: "link image | print preview media | forecolor backcolor emoticons | code | cms_upload"
            , image_advtab: true
        }
        , basic: {
            height: 300
            , menubar: false
            , plugins: [
                "autolink lists link image code anchor",
                "paste textpattern cms_upload",
                "table"
            ]
            , toolbar1: "bold italic underline | bullist numlist | formatselect | link code cms_upload | table"
            , block_formats: 'Paragraph=p;Heading=h2;Medium Heading=h3'
            , invalid_elements: "span"
        }
        , simple: {
            height: 40
            , content_css : _root + '/css/tinymce-simple.css'
            , paste_as_text: true
            , menubar: false
            , statusbar: false
            , plugins: [ "paste" ]
            , toolbar1: "underline"
            , forced_root_block: false
            , formats: {
                underline: {inline: 'u' }
            }
        }
    }
    , temp: {}


    ///////////////////////////////////////////////////////////////////////////
    , init: function() {
        if (_controller == 'projects' || _controller == 'textpages') {
            App.tinyMceSettings.basic.toolbar1 = 'bold italic underline | bullist numlist | link code | table';
        }
        else if (_controller == 'news') {
            App.tinyMceSettings.basic.toolbar1 += " | related_news";
        }
        if (App.hasInited) {
            return;
        }

        App.bind();

        App.loadFilterDatePicker();
        App.scrollMainMenuToActiveItem();
        $('select.basic-select').select2();
        $('input.slide').bootstrapSwitch({size: 'small'});
        $('input.switch').bootstrapSwitch({onColor: 'danger', offColor: 'success', size: 'small', onText: '<i class="fa fa-lock" />', offText: '<i class="fa fa-unlock" />'});
        $('input.tagsinput').tagsInput({defaultText: '', width: '100%'});
        App.initTagsInputWithAutocomplete();
        App.checkTextareaMaxlength();
        App.removeEmptyMenuItems();
        $('table.dnd').tableDnD({onDragStart: App.onRowDragStart, onDrop: App.onRowDrop, dragHandle: '.drag-handle'});
        App.checkFileReader();
        $('div.media-gal:not(.no-sorting)').sortable({forceHelperSize: true, forcePlaceholderSize: true, items: '.item', stop: App.onMediaSortStop});
        $(App.iCheckSelector).iCheck(App.iCheckSettings);
        App.initTinyMce('textarea.for-tiny', App.tinyMceSettings.main);
        App.initTinyMce('textarea.for-tiny-basic', App.tinyMceSettings.basic);
        App.initTinyMce('textarea.for-tiny-simple', App.tinyMceSettings.simple);
        $('div.spinner1').spinner({value: 0, min: 0, max: 35});
        $('select.multi-select1').multiSelect();
        App.initPagesNesetedSortable();
        App.initNestedTogglers();
        $('form.form-horizontal.bucket-form').after(App.hiddenIframe);
        $('.addables-wrapper').sortable({items: '> .addable-item', handle: '.handle'});
        $('.addables-wrapper.tabs-wrapper').sortable({stop: App.onTabsSortStop});
        $('ul.sortable').sortable({items: '> li'});
        $('select.select-with-checkboxes').each(App.onSelectWithCheckboxesChange);
        App.initMaxLengthCounters();
        $('.colorpicker-default').colorpicker({format: 'hex'});
        App.markAddableMenuAsUsed();
    }

    ///////////////////////////////////////////////////////////////////////////
    , bind: function() {
        $(document).ajaxSend(App.onAjaxSend);
        $(document).ajaxComplete(App.onAjaxComplete);
        $('#loader').bind('click', App.onLoaderClick);
        $(document).on('click', '.remove-parent', App.onRemoveParentClick);
        $(document).on('click', '.ajax-submit', App.onAjaxBtnClick);
        $('form table.files-list, #resuable-modal').on('keyup paste', 'input.video_url', App.onVideoInputPaste);
        $('input.switch.parent').bind('switchChange.bootstrapSwitch', App.onParentSwitchChangeState);
        $('input.switch:not(.parent)').bind('switchChange.bootstrapSwitch', App.onSwitchChangeState);
        $(document).on('click', 'a.btn.delete', App.onDeleteClick);
        $('button#open-filter').bind('click', App.onFilterClick);
        $('form').on('click', 'button.input-reset', App.onInputResetClick);
        // use document to include addables input change
        $(document).on('change', 'input[type="file"]', App.onInputFileChange);
        $('div.media-gal .item a').bind('click', App.onMediaItemClick);
        $('span.toggler, .toggler + span').bind('click', App.onTogglerClick);
        $('#save_order').bind('click', App.onSaveOrderClick);
        $('button.build-slug').bind('click', App.onBuildSlugClick);
        $('div.addables-list a.add-addable').bind('click', App.onAddAddableClick);
        $('div.addables-wrapper').on('click', '.remove-parent', App.onAddableRemoveClick);
        $('section#main-content form').on('change', 'select.chain-select', App.onChainSelectChange);
        $('a.general-sort-save').on('click', App.onGeneralSortSaveClick);
        $('div.tabs-wrapper').on('click', '.tab-text-toggler', App.onTabTextTogglerClick);
        $('span.input-group-btn span.date-set').bind('click', App.onInputDateButtonClick);
        $('div.addables-wrapper a.add-addable-window, .popup-window').bind('click', App.onAddAddableWindowButtonClick);
        $('input.check-toggler').bind('ifChanged', App.onCheckTogglerChange);
        $('button.unmark-all').bind('click', App.onUnmarkAllClick);
        $('#addable-window-insert-btn').bind('click', App.onAddableWindowInsertButtonClick);
        $('select.select-with-checkboxes').bind('change', App.onSelectWithCheckboxesChange);
        $('input.max-lengthed, textarea.max-lengthed').bind('keyup keypress input', App.onMaxLengthCounterChange);
        $(".table-search").on("input propertychange", App.searchInTable);
        $(document).on('focus', '.pseudo-tag',  function(){$(this).parent().parent().addClass('focused');});
        $(document).on('blur', '.pseudo-tag',  function(){$(this).parent().parent().removeClass('focused');});
        $(document).on('click', 'label', App.labelClickFocusTiny);
        $(".pointer").on("click", App.copyText);
        $('.close-window').bind('click', function(e){window.close();});
        $(document).on('click', 'a.btn.update-feed', App.updateSocialFeed);
        $('.translation-select').on('change', App.changeTranslationDomain);


        // Uploads gallery
        $(document).on('change', '#uploads-modal form input[type=file]', function(){$(this).parents('form').submit()});
        $(document).on('submit', '#uploads-modal form', App.uploadsGalleryOnFormSubmit);
        $(document).on('click', '#uploads-modal .modal-dialog .modal-content .modal-body a', App.uploadsGalleryOnAClick);
        $(document).on('click', '#uploads-modal .images.square img', App.uploadsGalleryOnItemImageClick);
        $(document).on('mouseenter', '#uploads-modal .images.square', function () { $(this).find('.uploads-edit').show()});
        $(document).on('mouseleave', '#uploads-modal .images.square', function () { $(this).find('.uploads-edit').hide()});
        $(document).on('click', '#uploads-modal .images.square', function () { $(this).find('.uploads-edit').hide()});
        $(document).on('click', '#uploads-modal a#uploads-insert-file', App.embedIntoTiny);
        $(document).on('click', '#uploads-modal button.btn.upload-delete', App.uploadsGalleryOnDeleteClick);
    }

    ///////////////////////////////////////////////////////////////////////////
    , changeTranslationDomain: function() {
        if (this.value) {
            window.location = this.value;
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    , updateSocialFeed: function(e) {
        e.preventDefault();
        App.skipAjaxLoader = true;
        var $this = $(this),
            $dialog = $('#updateDatabase');
        $dialog.modal('show');
        $.ajax({
            url: $(this).attr("href"),
            type: 'POST',
            dataType: 'json'
        }).error(function(data){
            App.showMessage('An error occured. Please contact support', false);
            $dialog.modal('hide');
            App.skipAjaxLoader = false;
        }).done(function(data) {
            if (data.redirect) {
                location.reload();
            }
            else {
                $dialog.modal('hide');
                App.showMessage(data.message, data.status);
            }
            App.skipAjaxLoader = false;
        });
    }

    ////////////////////////////////////////////////////////////////////////////
    , copyText: function() {
        var $this = $(this),
            $source = $($this.data("source")),
            $target = $($this.data("target")),
            nobr    = $this.data("nobreak"),
            source_val = $source.val();
        if (nobr) {
            source_val = source_val.replace(/\n/g, " ");
        }
        $target.val(source_val).focus();
    }

    ////////////////////////////////////////////////////////////////////////////
    , labelClickFocusTiny: function(e) {
        var id = $(this).attr('for'),
            field = $('#' + id);
        if (field.hasClass('for-tiny') || field.hasClass('for-tiny-basic') || field.hasClass('for-tiny-simple')) {
            tinyMCE.get(id).focus()
        }
    }

    ////////////////////////////////////////////////////////////////////////////
    , searchInTable: function() {
        var value = $(this).val().toLowerCase(),
            $target = $(this).parent().parent().find('tbody tr'),
            $save_order_btn = $('a.general-sort-save');
        $target.filter(function() {
            $(this).toggle($(this).find('td:not(.actions)').text().toLowerCase().indexOf(value) > -1)
        });

        // disable the save order button while searching
        if ($save_order_btn) {
            if (value == '') {
                var href = $save_order_btn.data('href');
                $save_order_btn.removeClass('btn-default').addClass('btn-info').attr('href', href).on('click', App.onGeneralSortSaveClick);
            }
            else {
                $save_order_btn.removeClass('btn-info').addClass('btn-default').removeAttr('href').off('click', App.onGeneralSortSaveClick);
            }
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    , initMaxLengthCounters: function() {
        $('input.max-lengthed, textarea.max-lengthed').each(function() {
            App.onMaxLengthCounterChange.call(this);
        });
    }

    ///////////////////////////////////////////////////////////////////////////
    , onMaxLengthCounterChange: function() {
        var $this = $(this)
            , itemId = $this.attr('id')
            , $charsLeftItem = $('#' + itemId + 'CharsLeft')
            , $maxLengthItem = $('#' + itemId + 'MaxLength')
            , currentLength = $this.val().length
            , maxLength = $this.attr('maxlength');

        $charsLeftItem.html(maxLength - currentLength);
        $maxLengthItem.html(maxLength);
    }

    ///////////////////////////////////////////////////////////////////////////
    , scrollMainMenuToActiveItem: function() {
        setTimeout(function() {
            if ($('#sidebar').length) {
                $('#sidebar').scrollTop($('#nav-accordion a.active, #nav-accordion li.active').last().offset().top - ($('#sidebar').height() - 80))
            }
        }, 900);
    }

    ///////////////////////////////////////////////////////////////////////////
    , initTagsInputWithAutocomplete: function() {
        $('input.tagsinput-autocomplete').each(function() {
            var $this = $(this);

            $this.tagsInput({defaultText: '', width: '100%', autocomplete_url: $this.data('autocomplete_url')});
        });
    }

    ///////////////////////////////////////////////////////////////////////////
    , onUnmarkAllClick: function() {
        var $this = $(this)
            , $parent = $this.closest($this.data('parent'))
            , $toggableItems = $parent.find($this.data('selector'));

        $toggableItems.iCheck('uncheck');
    }

    ///////////////////////////////////////////////////////////////////////////
    , onSelectWithCheckboxesChange: function() {
        var $this = $(this)
            , $options = $this.find('option');

        $options.each(function() {
            var $option = $(this)
                , checkboxesSelector = $option.data('checkboxes')
                , $checkboxes = $(checkboxesSelector);

            if ($option.prop('selected')) {
                $checkboxes.prop('checked', true).attr('checked', true);
            } else {
                $checkboxes.prop('checked', false).attr('checked', false);
            }
        });
    }

    ///////////////////////////////////////////////////////////////////////////
    , onAddableWindowInsertButtonClick: function() {
        var openerWin = window.opener
            , $addablesHolder = openerWin.$('div.addables-wrapper.' + window.name)
            , $addAddableWinBtn = $addablesHolder.find('div.input-group a')
            , modelName = $addAddableWinBtn.data('model')
            , modelAlias = $addAddableWinBtn.data('alias')
            , $checkedBoxes = $('tbody input[type="checkbox"]:checked')
            , existingIds = []
            , ids = [];

        // Collect the ids of the items that are already added to the main window
        $addablesHolder.find('.addable-item').each(function() {
            existingIds.push($(this).data('addable_id'));
        });


        // Collect the ids that are checked and are not addedd to the main window
        $checkedBoxes.each(function() {
            if ($.inArray(parseInt(this.value), existingIds) === -1) {
                ids.push(this.value);
            }
        }).iCheck('uncheck');

        // Uncheck the main toggling checkbox
        $('input.check-toggler').iCheck('uncheck');


        // If there any ids, fetch the html for them and insert it in the main window
        if (ids.length) {
            $.ajax({
                url: _root + '/home/load_addable_window_template'
                , data: {ids: ids, model: modelName, alias: modelAlias}
                , type: 'POST'
            }).done(function(data) {
                $addAddableWinBtn.parent().before(data);
            });
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    , onCheckTogglerChange: function() {
        var $this = $(this)
            , $parent = $this.closest($this.data('parent'))
            , $toggableItems = $parent.find($this.data('selector') + ':not(.check-toggler)');
        if (this.checked) {
            $toggableItems.iCheck('check');
        } else {
            $toggableItems.iCheck('uncheck');
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    , onAddAddableWindowButtonClick: function() {
        var $this = $(this)
            , newWinUrl = $this.attr('href')
            , newWinName = $this.data('wrapper_name')
            , newWin = window.open(newWinUrl, newWinName, 'width=800,height=600');

        newWin.focus();

        return  false;
    }

    ///////////////////////////////////////////////////////////////////////////
    , onTabTextTogglerClick: function() {
        var $this = $(this),
            $tab = $this.closest('.tab');

        if ($this.hasClass('closed')) {
            $this.removeClass('closed');
            $tab.find('.panel-body').slideDown();
            $tab.addClass('active');
        } else {
            $this.addClass('closed');
            $tab.find('.panel-body').slideUp();
            $tab.removeClass('active');
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    , onInputDateButtonClick: function() {
        $(this).parent().next('input').trigger('focus');
    }

    ///////////////////////////////////////////////////////////////////////////
    , onTabsSortStop: function() {
        var $element = $(arguments[1].item);

        $element.find('div.mce-tinymce').remove();
        var name = $element.find('textarea.for-tiny-basic').show().removeAttr('aria-hidden').attr('name');
        App.initTinyMce('[name="' + name + '"]', App.tinyMceSettings.basic);

        var name = $element.find('textarea.for-tiny-simple').show().removeAttr('aria-hidden').attr('name');
        App.initTinyMce('[name="' + name + '"]', App.tinyMceSettings.simple);
    }

    ///////////////////////////////////////////////////////////////////////////
    , onGeneralSortSaveClick: function() {
        var $this = $(this)
            , saveUrl = $this.attr('href')
            , $list = $($this.data('for'))
            , listItems = $list.is('ul,ol') ? 'li' : $this.data('list_items')
            , orderdIds = [];

        $list.find(listItems).each(function() {
            var $listItem = $(arguments[1]);
            if (typeof $listItem.data('id') !== 'undefined') {
                orderdIds.push($listItem.data('id'));
            }
        });


        if (orderdIds.length && (typeof App.temp.generalSortingAjaxWaiting === 'undefined' || !App.temp.generalSortingAjaxWaiting)) {
            App.temp.generalSortingAjaxWaiting = true;
            $.ajax({
                type: 'POST'
                , url: saveUrl
                , data: {ids: orderdIds}
                , dataType: 'JSON'
                , async: false
            }).done(function(data) {
                App.temp.generalSortingAjaxWaiting = false;
                App.showMessage(data.msg, data.status);
            });
        }

        return false;
    }

    ///////////////////////////////////////////////////////////////////////////
    , onChainSelectChange: function() {
        var $this = $(this)
            , $targetSelect = $($this.data('chain_for'))
            , loadHtmlUrl = $this.data('chain_src');

        $.ajax({
            type: 'POST'
            , url: loadHtmlUrl
            , data: {value: $this.val()}
        }).done(function(data) {
            $targetSelect.html(data);
        });
    }

    ///////////////////////////////////////////////////////////////////////////
    , onAddAddableClick: function(e) {
        var $this = $(this)
            , identifier = $this.data('identifier')
            , used_assetons = $("table.files-list").length;

        if (!$this.hasClass('used')) {
            e.preventDefault();

            // Check if an request is not already been made
            if (App.temp.fetchingAddableContent) {
                return;
            } else {
                App.temp.fetchingAddableContent = true;
            }

            // Init the cache holder if not exsisting
            App.temp.addableContent = App.temp.addableContent ? App.temp.addableContent : {};

            // Load from cache if any or request content from server
            if (App.temp.addableContent[identifier]) {
                App.addAddableTemplate(App.temp.addableContent[identifier], $this);
                App.temp.fetchingAddableContent = false;
            } else {
                $.ajax({
                    // if an addable has {upload}, the $list counter gets restarted
                    // which results in a wrong ID for the tbody
                    // the new ID will be: count of all currently used assetons + 1
                    url: $this.attr('href') + '/used-assetons:'+used_assetons
                }).done(function(data) {
                    App.temp.addableContent[identifier] = data;
                    App.addAddableTemplate(data, $this);
                    App.temp.fetchingAddableContent = false;
                });

                if ($this.hasClass('award-types')) {
                    $this.addClass('used');
                }
            }
        }
        else {
            return false;
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    , addAddableTemplate: function(data, $button) {
        var itemNumber = $button.attr('data-addables')
            , replaceRegex = new RegExp('data\\[' + $button.data('model') + '\\]\\[0\\]', 'g')
            , $content = $(data.replace(replaceRegex, 'data[' + $button.data('model') + '][' + itemNumber + ']'))
            , $appendTo = $button.data('append_to') ? $($button.data('append_to')) : null
            , tinyMCEfields = $button.data('tinymce_fields')
            , tinyMCEsimple = $button.data('tinymce_simple');

        $content.hide();
        $('.add-addable').attr('data-addables', $button.attr('data-addables') - 0 + 1);

        if ($appendTo) {
            $appendTo.append($content);
        } else {
            $button.parent('.input-group').before($content);
        }

        if (typeof tinyMCEfields !== 'undefined') {
            for (var c = 0, i = tinyMCEfields.length; c < i; ++c) {
                App.initTinyMce('[name="data[' + $button.data('model') + '][' + itemNumber + '][' + tinyMCEfields[c] + ']"]', App.tinyMceSettings.main);
            }
        }

        if (typeof tinyMCEsimple !== 'undefined') {
            for (var c = 0, i = tinyMCEsimple.length; c < i; ++c) {
                App.initTinyMce('[name="data[' + $button.data('model') + '][' + itemNumber + '][' + tinyMCEsimple[c] + ']"]', App.tinyMceSettings.simple);
            }
        }

        // use iCheck styles for the newly added checkboxes
        $content.iCheck(App.iCheckSettings);

        // initiate the max-length for the newly added inputs
        App.initMaxLengthCounters();

        $content.show('slow');

        // Focus the first input element
        $content.find('input:not([type="hidden"]), textare, select').first().focus();
    }

    ///////////////////////////////////////////////////////////////////////////
    , onAddableRemoveClick: function() {
        var $this = $(this)
            , $addButton = $this.closest('div.addables-wrapper').find('a.add-addable')
            , addableId = $this.attr('data-addable_id')
            , awardType = $this.attr('data-dropdown-link');

        if (addableId) {
            $this.closest('.addables-list').append('<input type="hidden" name="data[AddableRemove][' + $addButton.data('model') + '][]" value="' + addableId + '"/>');
        }

        if (awardType) {
            $('.'+awardType).removeClass('used');
        }
    }

    ////////////////////////////////////////////////////////////////////////////
    , markAddableMenuAsUsed: function() {
        var special = $('.special').length;
        if (special > 0) {
            $('.add-addable.link-special').addClass('used');
        }
    }


    ///////////////////////////////////////////////////////////////////////////
    , onBuildSlugClick: function() {
        var $this = $(this),
            selector = $this.data('from') ? $this.data('from') : 'input[name="title"]',
            $source = $(selector);

        $.ajax({
            url: _root + '/' + _controller + '/bulid_slug'
            , type: 'POST'
            , data: {
                from: $source.val()
            }
        }).done(function(data) {
            $this.closest('div.input-group').find('input').val(data);
        });


    }

    ///////////////////////////////////////////////////////////////////////////
    , checkFileReader: function() {
        if (!window.FileReader) {
            var $fileGroups = $('div.file-group.input-group');

            $fileGroups.find('span.file-upload').remove();
            $fileGroups.find('input[type="file"]').removeClass('hidden');
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    , removeEmptyMenuItems: function() {
        $('ul.sub:not(:has(li))').remove();
        $('li.sub-menu:not(:has(ul))').remove();
    }

    ///////////////////////////////////////////////////////////////////////////
    , initNestedTogglers: function() {
        $('ol.nestable ol:not(.keep-expanded)').hide();

        // Check if we have local/session storage
        if (typeof (window.Storage) === 'undefined' || typeof (window.sessionStorage.open_ids) === 'undefined') {
            return;
        }

        // Expand all items that need to expand
        for (var n = 0, storage = JSON.parse(sessionStorage.open_ids); n < storage.length; ++n)
        {
            var $listItem = $('#' + storage[n]);
            $listItem.find('> div.title > span.toggler').removeClass('closed');
            $listItem.find('> ol').show();
        }

    }

    ///////////////////////////////////////////////////////////////////////////
    , checkTextareaMaxlength: function() {
        if (!App.elementSupportsAttribute('textarea', 'maxLength'))
        {
            $('textarea[maxlength]').on('keyup keypress blur change', App.onTextareaMaxlengthChange);
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    , onTextareaMaxlengthChange: function(e) {
        var $this = $(this),
            maxLength = this.getAttribute('maxlength'),
            text = $this.val(),
            textLength = text.length;

        if (textLength > maxLength) {
            $this.val(text.substring(0, (maxLength)));
            e.preventDefault();
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    , elementSupportsAttribute: function(element, attribute) {
        var test = document.createElement(element);
        if (attribute in test) {
            return true;
        } else {
            return false;
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    , onParentSwitchChangeState: function() {
        var $this = $(this);

        $this.closest('.form-group').find('div.action input.switch').bootstrapSwitch('state', this.checked);
    }

    ///////////////////////////////////////////////////////////////////////////
    , onSwitchChangeState: function() {
        var $this = $(this),
            state = this.checked,
            changeParent = true,
            hasOn = state,
            $groupHolder = $this.closest('.form-group'),
            $groupChecks = $groupHolder.find('input[type="checkbox"]:not(.parent)').not(this);

        $groupChecks.each(function() {
            if (this.checked) {
                hasOn = true;
            }

            if (this.checked !== state) {
                changeParent = false;
            }
        });

        var $parent = $groupHolder.find('input.parent');

        if (changeParent) {
            $parent.bootstrapSwitch('state', state);
        } else if (hasOn) {
            $parent.unbind('switchChange.bootstrapSwitch', App.onParentSwitchChangeState);
            $parent.bootstrapSwitch('state', false);
            $parent.bind('switchChange.bootstrapSwitch', App.onParentSwitchChangeState);
        }

    }

    ///////////////////////////////////////////////////////////////////////////
    , initTinyMce: function(selector, settings) {
        var newsPlaceholder = '<hr id="placeholder" />';
        var defaultSettings = {
            selector: selector
            , branding: false
            , language: _lang === 'bg' ? 'bg_BG' : ''
            , content_css : _root + '/css/tinymce-custom-styles.css'
            , height: 300
            , paste_as_text: true
            , relative_urls: false
            , remove_script_host: false
            , image_dimensions: false
            , content_style: "img {max-width: 100%}"
            , setup: function(editor) {
                editor.on('init', function() {
                    $(editor.getBody()).on('blur', function(e) {
                        var textarea_id = "#" + $(this).data('id'),
                            iframe      = $(textarea_id + '_ifr'),
                            mce_panel   = iframe.parents('.mce-panel')[1];
                        $(mce_panel).removeClass('focused');
                    });
                    $(editor.getBody()).on('focus', function(e) {
                        var textarea_id = "#" + $(this).data('id'),
                            iframe      = $(textarea_id + '_ifr'),
                            mce_panel   = iframe.parents('.mce-panel')[1];
                        $(mce_panel).addClass('focused');
                    });
                });
                editor.on('change', function() {
                    tinymce.triggerSave();
                    tinymce.activeEditor.dom.addClass(tinymce.activeEditor.dom.select('ul'), 'tmc-list');
                });
                // related news placeholder
                if (_controller == 'news') {
                    editor.addButton('related_news', {
                        text: __relatedNews_button,
                        tooltip: __relatedNews_tooltip,
                        icon: 'mce-ico mce-i-orientation',
                        onclick: function() {
                            var editorContent   = tinymce.activeEditor.getContent();
                            var relatedState    = (editorContent.indexOf(newsPlaceholder) !== -1) ? true : false;
                            // if the placeholder is not present
                            if (!relatedState) {
                                // if there's a related article selected from the dropdown menu
                                if ($('#NewsRelatedNews').val() > 0) {
                                    tinymce.get('NewsDescription').execCommand('mceInsertContent', false, newsPlaceholder);
                                    this.active(!relatedState);
                                }
                                else {
                                    alert(__relatedNews_alert);
                                }
                            }
                            // otherwise remove it
                            else {
                                tinyMCE.activeEditor.dom.remove(tinyMCE.activeEditor.dom.select('hr#placeholder'));
                                this.active(!relatedState);
                            }
                        },
                        onPostRender: function() {
                            var editorContent   = $("#NewsDescription").val();
                            var relatedState    = editorContent.indexOf(newsPlaceholder);
                            if (relatedState !== -1) {
                                this.active(true);
                            }
                        }
                    });
                }
            }
            , theme: "modern"
            , link_class_list: [
                {title: '--', value: ''}
                , {title: 'Button', value: 'button'}
            ]
        };

        App.addTinyMcePlugins();

        $.extend(defaultSettings, settings);
        tinymce.init(defaultSettings);
    }

    , addTinyMcePlugins: function () {

        var editor_id = "";

        tinymce.PluginManager.add('cms_upload', function (editor, url) {
            // Add a button that opens a window
            editor.addButton('cms_upload', {
                //text: 'Insert file',
                tooltip: __upload,
                icon: 'upload',
                onclick: function() {
                    App.uploadFileFromTiny()
                }
            });
        });
    }

    /**
     * Plugin for embedding files into tinymce
     */
    , uploadFileFromTiny: function () {

        $.ajax({
            url: _root + '/' + _lang + '/uploads/index'
        }).done(function (response) {

            // Add contents to modal
            $('#uploads-modal .modal-dialog .modal-content').html(response);
            // Show modal
            $('#uploads-modal').modal('show');
            // Setup gallery variables
            App.embedFilesStorage = [];
            App.uploadsGalleryToggleLoader('hide');
        });
    }

    /**
     * Submit every form in the uploads gallery as ajax
     */
    , uploadsGalleryOnFormSubmit: function (e) {

        App.embedFilesStorage = [];

        e.preventDefault();

        var $this = $(this);

        var ajaxSettings = {
            url: $this.attr('action'),
            method: $this.attr('method'),
            beforeSend: function (xhr) { App.uploadsGalleryToggleLoader('show') },
            complete: function (xhr) { App.uploadsGalleryToggleLoader('hide') }
        }

        // Check if the file upload form is used
        if ($this.hasClass('upload-file-form')) {

            var fileInput = $this.find('input[type=file]');
            var formData = new FormData();

            $.each(fileInput[0].files, function (key, val) {
                formData.append(fileInput.attr('name'), val);
            });

            ajaxSettings['data'] = formData;
            ajaxSettings['contentType'] = false;
            ajaxSettings['processData'] = false;
            ajaxSettings['cache'] = false;
        }
        // Or any other standard form
        else {

            ajaxSettings['data'] = $this.serialize();
        }

        $.ajax(ajaxSettings).done(function (data) {
            App.uploadsGalleryUpdateContents(data);
        });

    }

    /**
     * Follow every link in the uploads gallery as ajax unless a specific class
     * is applied.
     */
    , uploadsGalleryOnAClick: function (e) {

        App.embedFilesStorage = [];

        var $this = $(this);

        if (!$this.hasClass('nopreventdefault')) {

            e.preventDefault();

            $.ajax({
                url: $this.attr('href'),
                cache: false,
                beforeSend: function (xhr) { App.uploadsGalleryToggleLoader('show') },
                complete: function (xhr) { App.uploadsGalleryToggleLoader('hide') }
            }).done(function (data) {
                App.uploadsGalleryUpdateContents(data);
            });
        }
    }

    /**
     * Add/remove file IDs from an array waiting to be embedded into tinnymce
     */
    , uploadsGalleryOnItemImageClick: function (e) {

        e.preventDefault();
        var $this = $(this);
        var parent = $this.parents('.images.square');

        // If file is selected
        if (parent.hasClass('square-selected')) {

            // Deselect it
            parent.removeClass('square-selected');
            // Remove it from file storage
            App.embedFilesStorage.splice($.inArray(parent.data('file_id'), App.embedFilesStorage), 1);
        }
        // If file is not already selected
        else {

            // Select it
            parent.addClass('square-selected');
            // Add it to file storage
            App.embedFilesStorage.push(parent.data('file_id'));
        }

        // Check if file storage has anything to embed
        if (App.embedFilesStorage.length > 0) {

            $('#uploads-modal #uploads-insert-file').removeClass('disabled');
        } else {

            $('#uploads-modal #uploads-insert-file').addClass('disabled');
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    , uploadsGalleryOnDeleteClick: function (e) {

        e.preventDefault();

        var $this = $(this)
        var $dialog = $('#uploadConfirmDelete');

        if ($this.hasClass('selected')) {

            $this.removeClass('selected');
            $dialog.fadeOut(100);
            $this.html($this.data('off'));
        }
        else {

            $this.addClass('selected');
            $dialog.fadeIn(100);
            $this.html($this.data('on'));
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    , uploadsGalleryOnSearch: function (e) {

        e.preventDefault();

        $.ajax({
            url: $(this).data('ajax'),
            data: { 'filter[broad][Upload.server_file_name]': $(this).parents('.uploads-search').find('input').val() },
            method: 'get',
            beforeSend: function (xhr) { App.uploadsGalleryToggleLoader('show') },
            complete: function (xhr) { App.uploadsGalleryToggleLoader('hide') }
        }).done(function (data) {
            App.uploadsGalleryUpdateContents(data);
            /*$('#uploads-modal .modal-dialog .modal-content .items-list').html($(data).find('.items-list'));
            $('#uploads-modal #uploads-insert-file').addClass('disabled');
            App.embedFilesStorage = [];*/
        });
    }

    /**
     * Set loading animation for the modal in the uploads gallery
     */
    , uploadsGalleryToggleLoader: function (state) {

        if (state === 'show') {

            $('#uploads-modal .loader-overlay').fadeIn(100);
        }

        if (state === 'hide') {

            $('#uploads-modal .loader-overlay').fadeOut(100)
        }
    }

    , uploadsGalleryUpdateContents: function (data) {

        $('#uploads-modal .modal-dialog .modal-content').html(data);
    }

    /**
     * Array storing IDs of files waiting to be embedded into tinymce
     */
    , embedFilesStorage : []

    /**
     * Request html for all files that are being embedded into tinymce
     */
    , embedIntoTiny: function (e) {

        e.preventDefault();

        var $this = $(this);
        var sendData = [];

        if ($this.data('embed_id')) {
            sendData.push($this.data('embed_id'));
        }
        else {
            sendData = App.embedFilesStorage;
        }

        $.ajax({
            url: $this.attr('href'),
            data: {ids: sendData},
            method: 'post',
            beforeSend: function (xhr) { App.uploadsGalleryToggleLoader('show') },
            complete: function (xhr) { App.uploadsGalleryToggleLoader('hide') }
        }).done(function (data) {
            tinymce.activeEditor.insertContent(data);
            App.embedFilesStorage = [];
            $('#uploads-modal').modal('toggle');
        });
    }

    ////////////////////////////////////////////////////////////////////////////
    , loadCropper: function () {

        var crop_wrapper = document.getElementById('crop-image');

        if (crop_wrapper) {

            var cropper = new Cropper(crop_wrapper, {
                //aspectRatio: NaN,
                viewMode: 2,
                zoomable: false,
                responsive: true,
                restore: true,
                crop: function (event) {

                    $('input[name=x]').val(event.detail.x);
                    $('input[name=y]').val(event.detail.y);
                    $('input[name=width]').val(event.detail.width);
                    $('input[name=height]').val(event.detail.height);
                }
            });
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    , onVideoInputPaste: function(e) {
        var $this = $(this),
            notKeys = [9, 45, 37, 38, 39, 40, 16, 17, 18, 20, 144, 33, 34, 35, 36];


        if (($.inArray(e.keyCode, notKeys) >= 0) || typeof e.keyCode === 'undefined' || e.keyCode === null)
        {
            return;
        }

        $this.popover('destroy');
        $this.parent().find('div.popover').remove();

        setTimeout(function() {
            App.videoInputInformation($this);
        }, 100);
    }

    ///////////////////////////////////////////////////////////////////////////
    , videoInputInformation: function($input) {

        var videoProvider = App.getVideoProvider($input.val());
        var idExtractorFunction = 'extract' + videoProvider + 'Id';
        var videoId = typeof App[idExtractorFunction] === 'function' ? App[idExtractorFunction]($input.val()) : null;

        if (!$input.val()) {
            App.videoEmpty($input);
            return;
        } else if (!videoId) {
            App.videoError($input);
            return;
        }

        $.ajax({
            url: _root + '/' + _controller + '/video_data'
            , type: 'POST'
            , dataType: 'json'
            , data: {
                id: videoId
                , videoProvider: videoProvider
            }
        }).done(function(data) {
            if (data.status) {
                App.videoOk($input, data);
            } else {
                App.videoError($input);
            }
        });
    }

    ///////////////////////////////////////////////////////////////////////////
    , getVideoProvider: function(videoUrl) {
        var anchor = App.getAnchorFromUrl(videoUrl);
        var hostname = anchor.hostname;
        var videoProvider = '';

        switch (hostname)
        {
            case 'www.youtube.com':
                videoProvider = 'YouTube';
                break;
            case 'vimeo.com':
                videoProvider = 'Vimeo';
                break;
        }

        return videoProvider;
    }

    ///////////////////////////////////////////////////////////////////////////
    , getAnchorFromUrl: function(url) {
        var anchor = document.createElement("a");
        anchor.href = url;
        return anchor;
    }

    ///////////////////////////////////////////////////////////////////////////
    , videoError: function($input) {
        $input.popover({
            title: __errorMsg
            , content: '"' + $input.val() + '"   ' + __vErrText
            , trigger: 'focus'
        });
        $input.css('background-color', '#F4BABA');

        if ($input.is(":focus")) {
            $input.popover('show');
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    , videoOk: function($input, data) {
        var content = (typeof data.html === 'string') ? data.html : '';
        $input.popover({
            title: __successMsg
            , content: content
            , html: true
            , trigger: 'focus'
        });
        $input.css('background-color', '#DFF0D8');

        if ($input.is(":focus")) {
            $input.popover('show');
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    , videoEmpty: function($input) {
        $input.css('background-color', '');
    }

    ///////////////////////////////////////////////////////////////////////////
    , extractYouTubeId: function(url) {
        var match = url.match(_youTubeRegex);

        if (match && match[1].length === 11) {
            return match[1];
        } else {
            return false;
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    , extractVimeoId: function(url) {
        var match = url.match(_vimeoRegex);

        if (match && match[3]) {
            return match[3];
        } else {
            return false;
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    , truncateString: function(str, length) {
        return str.length > length ? str.substring(0, length - 3) + '...' : str;
    }

    ///////////////////////////////////////////////////////////////////////////
    , onTogglerClick: function() {
        var $this = $(this).hasClass('toggler') ? $(this) : $(this).prev('.toggler'),
            $listItem = $this.closest('li'),
            $subList = $listItem.find('ol').first();

        $subList.stop(true, true);

        if ($this.hasClass('closed')) {
            $subList.slideDown();
            App.addToOpennedTogglers($listItem.attr('id'));
        } else {
            $subList.slideUp();
            App.removeFromOpennedTogglers($listItem.attr('id'));
        }

        $this.toggleClass('closed');
    }

    ///////////////////////////////////////////////////////////////////////////
    , addToOpennedTogglers: function(id) {
        if (typeof (Storage) === 'undefined' || !id) {
            return;
        }

        if (sessionStorage.open_ids) {
            var open_ids = JSON.parse(sessionStorage.open_ids);
            open_ids.push(id);
            sessionStorage.open_ids = JSON.stringify(open_ids);
        } else {
            sessionStorage.open_ids = JSON.stringify([id]);
        }

    }

    ///////////////////////////////////////////////////////////////////////////
    , removeFromOpennedTogglers: function(id) {
        if (typeof (Storage) === 'undefined' || !id) {
            return;
        }

        if (!sessionStorage.open_ids) {
            return;
        } else {
            var index = $.inArray(id, JSON.parse(sessionStorage.open_ids));
            if (index > -1) {
                var open_ids = JSON.parse(sessionStorage.open_ids);
                open_ids.splice(index, 1);
                sessionStorage.open_ids = JSON.stringify(open_ids);
            }
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    , onSaveOrderClick: function() {
        var saveUrl = App.$nestable.data('save_url'),
            serialized = App.$nestable.nestedSortable('toArray');

        $.ajax({
            url: saveUrl
            , type: 'POST'
            , data: {
                serialized: JSON.stringify(serialized)
            }
            , dataType: 'json'
        }).done(function(data) {
            App.showMessage(data.message, data.status);
        });
    }

    ///////////////////////////////////////////////////////////////////////////
    , showMessage: function(msg, type) {

        var html = '<button type="button" class="close close-sm" data-dismiss="alert">'
            + '<i class="fa fa-times"></i>'
            + '</button>'
            + '<h4>' + (type ? __successMsg : __errorMsg) + '</h4>'
            + '<p>' + msg + '</p>'
            + '</div>'
            , div = type ? '<div class="alert alert-success alert-block fade in">' : '<div class="alert alert-block alert-danger fade in">';



        $('div.alert').remove();
        $('section.wrapper > .row').first().after(div + html);
    }

    ///////////////////////////////////////////////////////////////////////////
    , initPagesNesetedSortable: function() {
        App.$nestable = $('ol.nestable');

        App.$nestable.nestedSortable({
            handle: 'span.handle'
            , toleranceElement: 'div'
            , disableParentChange: false
            , items: 'li'
            , revert: 250
            , maxLevels: 3
            , protectRoot: true
            , forcePlaceholderSize: true
            , placeholder: 'placeholder'
            , startCollapsed: true
            , excludeRoot: true
        });
    }

    ///////////////////////////////////////////////////////////////////////////
    , onMediaSortStop: function() {
        var $this = $(arguments[1].item),
            $items = $this.parent().find('div.item'),
            model = $this.find('a[data-model]').data('model'),
            $label = $('<span class="label label-info main" style="display: none;">' + __main + '</span>'),
            main = $items.find('span.label.main'),
            order = [];

        $items.each(function(index, value) {
            order.push($(value).find('a').data('attachment_id'));
        });

        if ($items.length > 1) {
            if (main.length > 0) {
                $items.find('span.label.main').remove();
                $items.first().prepend($label);
                $label.fadeIn();
            }

            $.ajax({
                type: 'POST'
                , url: _root + '/' + _controller + '/save_attachments_order'
                , data: {ids: order,model:model}
            });
        }

    }

    ///////////////////////////////////////////////////////////////////////////
    , onAjaxBtnClick: function() {
        var $this = $(this),
            $form = $this.closest('form'),
            formData = $form.serialize(),
            url = $form.attr('action'),
            method = $form.attr('method');

        $.ajax({
            url: url
            , type: method
            , data: formData
            , success: function(response) {
                $form.find('.ajax-response').html(response);
            }
        });
    }


    ///////////////////////////////////////////////////////////////////////////
    , onMediaItemClick: function(e) {
        e.preventDefault();

        var $this = $(this),
            attId = $this.data('attachment_id'),
            model = $this.data('model'),
            $modal = $('#resuable-modal')
            , url = _root + '/' + (_langsCount > 1 ? _lang + '/' : '') + _controller + '/view_attachment/attachment_id:' + attId + '/model:' + model;

        if (!attId) {
            return;
        }

        $.ajax({
            type: 'GET'
            , url: url
            , success: function(data) {
                $modal.find('.modal-content').html(data);
                $modal.modal('show');
                App.videoInputInformation($modal.find('input.video_url').first());
            }
        });
    }

    ///////////////////////////////////////////////////////////////////////////
    , onInputFileChange: function() {
        var $this = $(this).unbind('change'),
            $clone = $this.clone(),
            ident = App.randomNumber();

        if ($this.data('only_one')) {
            $this.closest('.form-group').find('table a.remove-parent').trigger('click');
        }

        $this.bind('removeSeek', App.onRemoveSeek);
        $this.attr('data-ident', ident);
        $this.addClass('hidden');
        $this.after($clone);
        $this.next('input')[0].value = '';

        App.addFilesList(this, $this.data('append_to'), ident);
    }

    ///////////////////////////////////////////////////////////////////////////
    , onRemoveSeek: function(e, ident) {
        var $this = $(this);
        if ($this.data('ident').toString() === ident.toString()) {
            $this.remove();
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    , addFilesList: function(input, append_to, ident) {
        var files = input.files ? input.files : App.getMockFileList(input);

        if (!files.length) {
            return;
        }

        var $append_to = $(append_to),
            $header = $(append_to+"-header"),
            $this = $(input),
            isFirst = true,
            blankSrc = _root + '/img/blank.png',
            removeBtn = '<td rowspan="' + files.length + '">'
            + '<a href="javascript:;" class="remove-parent" data-selector="tr" data-ident="' + ident + '">'
            + '<i class="fa fa-times"></i>'
            + '</a>'
            + '</td>';

        for (var i = files.length, c = 0; c < i; ++c) {

            var element = '<tr>';
            var force_video = $this.data('force_video') ? 'required' : '';
            element += '<td>' + App.truncateString(files[c].name, 50) + '</td>';
            element += ($this.data('filename') ? '<td>' + '<input class="form-control" type="text" name="' + $this.data('filename_input') + '" maxlength="255" value="' + files[c].name.replace(/\.[^/.]+$/, "") + '" />' + '</td>' : '');
            element += ($this.data('title') ? '<td>' + '<input class="form-control" type="text" name="' + $this.data('title_input') + '" maxlength="255" />' + '</td>' : '');
            element += ($this.data('css') ? '<td>' + '<input class="form-control" type="text" name="' + $this.data('css_input') + '" maxlength="255" required />' + '</td>' : '');
            element += ($this.data('css') ? '<td>' + '<select class="form-control" name="' + $this.data('animation_speed') + '"><option value="1">Slow</option> <option value="2">Medium</option><option value="3">Fast</option> </select></td>' : '');
            element += ($this.data('keywords') ? '<td>' + '<input type="text" class="form-control tagsinput" name="' + $this.data('keywords_input') + '" />' + '</td>' : '');
            element += ($this.data('description') ? '<td>' + '<input type="text" class="form-control" name="' + $this.data('description_input') + '" maxlength="500" />' + '</td>' : '');
            element += ($this.data('video') ? '<td>' + '<input type="text" name="' + $this.data('video_input') + '" class="form-control video_url" data-placement="top" ' + force_video + ' />' + '</td>' : '');
            element += '<td>' + (files[c].size ? (files[c].size / 1024).toFixed(2) : '--') + ' KB</td>';
            element += '<td><img data-ident="' + ident + '" src="" /></td>';

            if (c === 0 && !window.FileReader) {
                isFirst = false;
                element += removeBtn;
                if ((/\.(gif|jpg|jpeg|tiff|png)$/i).test(files[c].name)) {
                    blankSrc = _root + '/img/loader_40x40.gif';
                    App.loadImageFromIframe(input, ident);
                }
            }
            element += '</tr>';

            var $element = $(element);

            if (files[c].type.indexOf('image/') === 0 && window.FileReader) {
                var reader = new FileReader();
                reader.$element = $element;
                reader.file = files[c];
                reader.onload = function() {
                    $append_to.append(this.$element).find('input.tagsinput').tagsInput({defaultText: ''});
                    this.$element.find('img').attr('src', this.result).resizecrop({
                        width: 40
                        , height: 40
                    }).addClass($this.data('thumbs').length ? 'thumb-preview' : '').data('thumbs', $this.data('thumbs')).data('ident', ident);
                    if (isFirst) {
                        isFirst = false;
                        this.$element.append(removeBtn);
                    }
                };
                reader.readAsDataURL(files[c]);
            } else {
                if (isFirst) {
                    isFirst = false;
                    $element.append(removeBtn);
                }
                $append_to.append($element).find('input.tagsinput').tagsInput({defaultText: ''});
                $element.find('img').attr('src', blankSrc);
            }
        }
        $($header).slideDown(350);
    }


    ///////////////////////////////////////////////////////////////////////////
    , getMockFileList: function(input) {
        var FileList = []
            , path = input.value;

        if (path.length) {
            FileList[0] = {
                name: path.replace(/^.+(\\|\/)(.+)/, '$2')
                , path: path
                , size: null
                , type: ''
            };
        }

        return FileList;
    }

    ///////////////////////////////////////////////////////////////////////////
    , loadImageFromIframe: function(self, ident) {
        var $this = $(self)
            , $form = $(self.form)
            , originalFormAction = $form.attr('action') ? $form.attr('action') : window.location.href
            , $fileInputs = $form.find('input[type="file"]').not($this)
            , $iframe = $form.next('iframe');


        // Remove name attribute value so that the input do not get submited
        $fileInputs.each(function() {
            var $item = $(arguments[1]);
            $item.attr('data-name', $item.attr('name')).attr('name', '');
        });

        // Submit the form into a hidden iframe
        $form.attr('action', _root + '/' + _controller + '/image_preview' + '?for_input=' + ident);
        $form.attr('target', $iframe.attr('name'));
        $form.submit();

        // Clean up after submit
        $form.attr('target', '');
        $form.attr('action', originalFormAction);

        $fileInputs.each(function() {
            var $item = $(arguments[1]);
            $item.attr('name', $item.attr('data-name'));
        });
    }

    ///////////////////////////////////////////////////////////////////////////
    , onRemoveParentClick: function() {
        var $this = $(this),
            $closestParent = $this.parent(),
            parent_selctor = $this.data('selector');

        // If the remove btn is for more than one rows in a table
        if ($closestParent.is('td') && $closestParent.attr('rowspan') > 1) {
            var rowsToRemove = $closestParent.attr('rowspan'),
                $closestTr = $closestParent.parent();

            for (var c = 1; c < rowsToRemove; ++c) {
                $closestTr.next('tr').remove();
            }
        }

        // If the btn has an ident triger an event to seek and remove file input
        if ($this.data('ident')) {
            $('input[type="file"]').trigger('removeSeek', [$this.data('ident')]);
        }

        // Match the parent by the selector and remove it
        if (typeof parent_selctor !== 'undefined') {
            $this.closest(parent_selctor).hide('slow', App.remove);
        } else {
            $this.parent().hide('slow', App.remove);
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    , remove: function() {
        var $wrapper = $(this).parents().eq(0),
        header   = '#'+$wrapper.prop("id")+'-header';
        $(this).remove();
        if ($(header) && ($wrapper.find('tr').size() == 0)) {
            $(header).slideUp(450);
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    , onLoaderClick: function() {
        $(this).removeClass('la-animate');
    }

    ///////////////////////////////////////////////////////////////////////////
    , onAjaxSend: function() {
        if (!App.skipAjaxLoader)
        {
            App.showLoader();
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    , onAjaxComplete: function() {
        var status = arguments[1]
            , $modal = $('#resuable-modal');

        if (typeof status.responseText !== 'undefined' && status.responseText.match('id="session-expired"')) {
            $modal.find('.modal-content').html(status.responseText);
            $modal.modal('show');
            return false;
        } else {
            setTimeout(App.hideLoader, 400);
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    , showLoader: function() {
        $("#loader").addClass('la-animate').css('display', 'block');
    }

    ///////////////////////////////////////////////////////////////////////////
    , hideLoader: function() {
        $("#loader").removeClass('la-animate');
    }

    ///////////////////////////////////////////////////////////////////////////
    , onRowDragStart: function(table) {
        if (App.tableRowsOrder.length) {
            return;
        }

        $(table).find('tbody tr').each(function(index, value) {
            App.tableRowsOrder.push($(value).data('id'));
        });
    }

    ///////////////////////////////////////////////////////////////////////////
    , onRowDrop: function(table) {
        var order = []
            , $table = $(table)
            , sort_classes = ['fa-sort-asc', 'fa-sort-desc', 'fa-sort'];

        $table.find('tbody tr').each(function(index, value) {
            order.push($(value).data('id'));
            $(value).find('td.order').html(index);
        });

        if (order.equals(App.tableRowsOrderLast))
        {
            return;
        }


        App.tableRowsOrderLast = order;

        var $sort_icons = $table.find('th i.' + sort_classes[0] + ', th i.' + sort_classes[1]);
        $sort_icons.removeClass(sort_classes[0] + ' ' + sort_classes[1]);
        $sort_icons.addClass(sort_classes[2]);

        $table.find('th.order i').removeClass('fa-sort').addClass(sort_classes[0]);

        // If counter field is set, update it
        if($('.row-counter') != 'undefined'){
            var counter = 1;
            $table.find('.row-counter').each(function(){
                $(this).html(counter);
                counter++;
            })
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    , onDeleteClick: function(e) {
        e.preventDefault();
        var $this = $(this)
            , $dialog = $('#confirmDelete');

        $dialog.find('a.btn-warning').attr('href', $this.attr('href'));
        $dialog.modal('show');
    }

    ///////////////////////////////////////////////////////////////////////////
    , onFilterClick: function(e) {
        e.preventDefault();
        $('#filter').modal('show');
    }

    ///////////////////////////////////////////////////////////////////////////
    , loadFilterDatePicker: function() {
        $('input.dpd2, input.dpd1').datetimepicker({format: App.datepickerDateFormat, autoclose: true, minView: 2, todayBtn: true});
        $('input.form_datetime').datetimepicker();
    }

    ///////////////////////////////////////////////////////////////////////////
    , onInputResetClick: function() {
        var $parent = $(this).parent(),
            $input = $parent.prev('input').length ? $parent.prev('input') : $parent.next('input');

        $input.val('').trigger('change');
    }

    ///////////////////////////////////////////////////////////////////////////
    , randomNumber: function() {
        return Math.random().toString().replace(/\d+\./, '');
    }
};

App.init();
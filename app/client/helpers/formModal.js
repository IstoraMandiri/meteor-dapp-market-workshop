// attach to `app` namespace
app.formModal = function (args, callback) {
  if (!args.template) {
    throw Error('Template undefined')
  }
  let modalData = {
    bodyTemplate: args.template,
    dataContext: args.data,
    title: args.title,
    fixedFooter: true,
    leftButtons: [{
      html: 'Cancel'
    }],
    rightButtons: [{
      html: 'Submit',
      fn: function (e, tmpl) {
        // trigger HTML5 validation
        $(tmpl.find('input[type="submit"]')).click()
      }
    }]
  }
  // spawn the modal
  const $thisModal = EZModal(modalData)
  // initialize materialize textareas.
  $('textarea', $thisModal).trigger('autoresize')
  // wire up HTML5 validation by injecting 'submit' element
  const $thisModalForm = $('.modal-content form', $thisModal)
  $thisModalForm.append('<input type="submit" class="hide"/>')
  // override submit event and callback if valid
  $thisModalForm.on('submit', function (e) {
    e.preventDefault()
    // by now we are valid - return the serialized data
    callback(null, $thisModalForm.serializeJSON())
    // bye bye
    $thisModal.closeModal()
  })
  return $thisModal
}

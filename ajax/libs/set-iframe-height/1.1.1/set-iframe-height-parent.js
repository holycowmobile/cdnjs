(function (root, factory) {
  var $ = root.jQuery;

  if (typeof define === 'function' && define.amd) {
    // AMD
    if ($) {
      define([], factory.bind(null, $));
    }
    else {
      define(['jquery'], factory);
    }
  } else if (typeof exports === 'object') {
    // Node, CommonJS-like
    if ($) {
      module.exports = factory($);
    }
    else {
      module.exports = factory(require('jquery'));
    }
  } else {
    // Browser globals (root is window)
    if ($) {
      root.setIframeHeight = factory($);
    }
    else {
      throw 'Missing required jQuery dependency';
    }
  }
}(this, function ($) {
  /************** EVENT BINDINGS **************/

  $(window).
    bind('setIframeHeight', onSetIframeHeight).
    bind('message', onMessage);


  /************** PUBLIC INTERFACE **************/

  var that = {
    setHeight: function(iframeSrc, height, iframeReferrer) {
      $(window).trigger('setIframeHeight', [{ iframeSrc: iframeSrc, height: height, iframeReferrer: iframeReferrer }]);
    }
  };


  /************** PRIVATE VARS AND FUNCTIONS **************/

  function findIframeBySrc(src) {
    var bestMatchingIframe = null;

    $('iframe').each(function(idx, iframe) {

      var $iframe = $(iframe);
      var iframeSrc = $iframe.attr('data-iframeAutoHeight-currentSrc') || iframe.src;
      if (iframeSrc) {
        if (iframeSrc.indexOf('/') === 0) {
          iframeSrc = getHostForUrl(document.location.href) + iframeSrc;
        }
        if (iframeSrc === src) {
          bestMatchingIframe = iframe;
        }
        else if (getHostForUrl(iframeSrc) === getHostForUrl(src)) {
          bestMatchingIframe = iframe;
        }
      }
    });

    return bestMatchingIframe;
  }

  function getHostForUrl(url) {
    var matches = url.match(/https?:\/\/.[^/]+/) || [];
    return matches[0];
  }

  function onSetIframeHeight(e, data) {
    var iframe = findIframeBySrc(data.iframeSrc);

    if (!iframe && data.iframeReferrer) {
      iframe = findIframeBySrc(data.iframeReferrer);
    }
    if (iframe) {
      var $iframe = $(iframe);
      $iframe.height(data.height);
      $iframe.attr('data-iframeAutoHeight-currentSrc', data.iframeSrc);

      if (window.history.replaceState && $iframe.attr('data-iframeAutoHeight-deepLinkPattern')) {
        var parentUrl = $iframe.attr('data-iframeAutoHeight-deepLinkPattern').replace(/%deepLinkIframeSrc%/, encodeURIComponent(data.iframeSrc));
        if (document.location.href !== parentUrl) {
          window.history.replaceState({}, '', parentUrl);
          $(window).trigger('setIframeHeight:deepLink:changed', {
            childUrl: data.iframeSrc,
            parentUrl: parentUrl
          });
        }
      }
    }
  }

  function onMessage(e) {
    var data = e.originalEvent.data;
    if (data.indexOf('::')) {
      var data = data.split('::');
      if (data.length === 2 && data[0] === 'setIframeHeight') {
        var params = $.parseJSON(data[1]);
        that.setHeight(params.iframeSrc, params.height, params.iframeReferrer);
      }
    }
  }

  return that;
}));
